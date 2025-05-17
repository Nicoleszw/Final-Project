import { Router } from 'express';
import { randomUUID } from 'crypto';
import { pool } from '../services/db.js';
import { authenticate } from '../middlewares/auth.js';
import { openai } from '../services/openai.js';
import { classifyEmotion } from '../services/emotion.js';
import { isNativeError } from 'util/types';

const router = Router();

/* ─────── Constantes ─────── */
const mapES = {
  alegría: 'joy',
  tristeza: 'sadness',
  ira: 'anger',
  miedo: 'fear',
  sorpresa: 'surprise',
  neutral: 'neutral',
};

const systemPrompt = `
You are an empathetic psychologist. Use the full context of the conversation to personalise your responses.
When a user starts or continues a conversation, ask brief, caring follow-up questions to explore their feelings.
If they express distress, gently encourage seeking professional help.
Then offer practical emotional support and short advice based on CBT or mindfulness.
Always keep your tone supportive and understanding.
`;


router.post('/stream', authenticate, async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  req.socket.setTimeout(0);
  const ping = setInterval(() => res.write(':\n\n'), 30_000);

  try {
    const userId = req.user.id;
    const { content = '' } = req.body;
    if (!content.trim()) {
      res.write('event: error\ndata: Empty message\n\n');
      return res.end();
    }

    /* Sesión */
    const { rows: latest } = await pool.query(
      `SELECT session_id, created_at
         FROM messages
        WHERE user_id = $1
     ORDER BY id DESC
        LIMIT 1`,
      [userId],
    );

    const now        = new Date();
    const last       = latest[0];
    const same       = last && now - new Date(last.created_at) < 1_800_000;
    const sessionId  = same ? last.session_id : randomUUID();

    res.write(`event: session\ndata: ${sessionId}\n\n`);

    /* Guarda mensaje de usuario */
    const {
      rows: [{ id: messageId }],
    } = await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
            VALUES ($1,'user',$2,$3)
         RETURNING id`,
      [userId, content, sessionId],
    );

    /* Emoción */
    let english = 'neutral';
    try {
      const emotion = await classifyEmotion(content);
      english = mapES[emotion.label] ?? emotion.label;
      await pool.query(
        `INSERT INTO emotions (message_id, label, score)
              VALUES ($1,$2,$3)`,
        [messageId, english, emotion.score],
      );
    } catch (err) {
      console.warn('Emotion service failed:', err);
    }
    res.write(`event: emotion\ndata: ${english}\n\n`);

    /* Contexto */
    const { rows: recentSessions } = await pool.query(
      `SELECT session_id
         FROM messages
        WHERE user_id = $1
     GROUP BY session_id
     ORDER BY MAX(created_at) DESC
        LIMIT 3`,
      [userId],
    );

    const sessionIds = recentSessions.map((s) => s.session_id);

    const { rows: history } = await pool.query(
      `SELECT role, content
         FROM messages
        WHERE user_id = $1
          AND session_id = ANY($2)
     ORDER BY id
        LIMIT 60`,
      [userId, sessionIds],
    );

    const prompt = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content },
    ];

    /* Streaming OpenAI */
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: prompt,
      temperature: 0.7,
      stream: true,
    });

    let assistantText = '';

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (!delta) continue;
      assistantText += delta;
      res.write(`data: ${delta}\n\n`);
    }

    res.write('event: end\ndata: [DONE]\n\n');

    await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
            VALUES ($1,'assistant',$2,$3)`,
      [userId, assistantText.trim(), sessionId],
    );
    res.end();
  } catch (err) {
    const msg = isNativeError(err) ? err.message : 'Unexpected error';
    console.error('Streaming error:', msg, err.stack);
    if (!res.headersSent) res.writeHead(500);
    res.write(`event: error\ndata: ${msg}\n\n`);
    res.end();
  } finally {
    clearInterval(ping);
  }
});


router.post('/end-session', authenticate, async (req, res) => {
  try {
    const sid =
      req.body.session_id ||
      (
        await pool.query(
          `SELECT session_id
             FROM messages
            WHERE user_id = $1
         ORDER BY id DESC
            LIMIT 1`,
          [req.user.id],
        )
      ).rows[0]?.session_id;

    if (!sid) return res.status(400).send('No active session');

    await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
            VALUES ($1,'assistant',$2,$3)`,
      [req.user.id, 'Session closed by user.', sid],
    );
    res.sendStatus(204);
  } catch (err) {
    console.error('End-session error:', err);
    res.status(500).send('Could not end session');
  }
});


router.get('/sessions', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
         session_id,
         MIN(created_at)               AS started_at,
         MAX(created_at)               AS ended_at,
         COUNT(*) FILTER (WHERE role='assistant') AS answers,
         LEFT(
              COALESCE(
                 MAX(CASE WHEN role='assistant' THEN content END),
                 MAX(CASE WHEN role='user'      THEN content END)
              ),
              80
         ) AS preview
     FROM messages
    WHERE user_id = $1
 GROUP BY session_id
 ORDER BY ended_at DESC
    LIMIT 5`,
    [req.user.id],
  );

  /* Epoch ms → el front los interpreta en su huso horario */
  rows.forEach((r) => {
    const startMs = r.started_at.getTime();
    const endMs   = r.ended_at.getTime();
    r.started_at  = startMs;
    r.ended_at    = endMs;
    r.date        = startMs;
  });

  res.json(rows);
});


router.get('/session/:id/messages', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT role, content, EXTRACT(EPOCH FROM created_at)*1000 AS ts
       FROM messages
      WHERE user_id   = $1
        AND session_id = $2
   ORDER BY id`,
    [req.user.id, req.params.id],
  );
  res.json(rows);
});

router.get('/session/:id/summary', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT role, content
       FROM messages
      WHERE user_id   = $1
        AND session_id = $2
   ORDER BY id`,
    [req.user.id, req.params.id],
  );

  if (!rows.length) return res.status(404).send('Not found');

  const plain = rows.map((m) => `${m.role}: ${m.content}`).join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'Summarize the following therapy chat in 2-3 empathetic sentences.',
      },
      { role: 'user', content: plain },
    ],
  });

  res.json({ summary: completion.choices[0].message.content.trim() });
});


router.get('/summary/by-day/:date', authenticate, async (req, res) => {
  const day = req.params.date; // '2025-05-17'
  try {
    const { rows } = await pool.query(
      `SELECT role, content
         FROM messages
        WHERE user_id = $1
          AND DATE(created_at AT TIME ZONE 'Asia/Jerusalem') = $2::date
     ORDER BY id`,
      [req.user.id, day],
    );

    if (!rows.length) return res.status(404).send('No messages that day');

    const plain = rows.map((m) => `${m.role}: ${m.content}`).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Give an empathetic two-sentence summary of the user’s mood and progress for that day.',
        },
        { role: 'user', content: plain },
      ],
    });

    res.json({ summary: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error('Daily summary error:', err);
    res.status(500).send('Could not generate summary');
  }
});

export default router;
