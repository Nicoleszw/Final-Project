import { Router } from 'express';
import { randomUUID } from 'crypto';
import { pool } from '../services/db.js';
import { authenticate } from '../middlewares/auth.js';
import { openai } from '../services/openai.js';
import { classifyEmotion } from '../services/emotion.js';
import { isNativeError } from 'util/types';

const router = Router();

/* Mapeo etiquetas ES ➜ EN para el badge */
const mapES = {
  alegría: 'joy',
  tristeza: 'sadness',
  ira: 'anger',
  miedo: 'fear',
  sorpresa: 'surprise',
  neutral: 'neutral',
};

/* Mensaje de sistema (prompt) para el psicólogo */
const systemPrompt = `
You are an empathetic psychologist. When a user starts a conversation, begin with a brief, caring follow-up question to explore their feelings.
If they express distress or mental-health concerns, encourage them gently to seek professional help.
Once you understand the situation better, offer practical emotional support and short advice based on CBT or mindfulness.
Always keep your tone supportive and understanding.
`;

/* ────────────────────────────────────────────────
   STREAMING ENDPOINT (SSE) — POST /messages/stream
   ──────────────────────────────────────────────── */
router.post('/stream', authenticate, async (req, res) => {
  /* Cabeceras SSE */
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  req.socket.setTimeout(0);

  /* Heartbeat cada 30 s */
  const ping = setInterval(() => res.write(':\n\n'), 30_000);

  try {
    const userId = req.user.id;
    const { content = '' } = req.body;
    if (!content.trim()) {
      res.write('event: error\ndata: Empty message\n\n');
      return res.end();
    }

    /* ─────────────────── Sesión ─────────────────── */
    const { rows: latest } = await pool.query(
      `SELECT session_id, created_at
         FROM messages
        WHERE user_id = $1
     ORDER BY id DESC
        LIMIT 1`,
      [userId],
    );

    const now = new Date();
    const lastSession = latest[0];
    const sameSession =
      lastSession && now - new Date(lastSession.created_at) < 1_800_000; // 30 min
    const sessionId = sameSession ? lastSession.session_id : randomUUID();

    /* Guardamos mensaje del usuario */
    const userMsg = await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
            VALUES ($1,'user',$2,$3)
         RETURNING id`,
      [userId, content, sessionId],
    );

    /* ───────────── Clasificación emoción ─────────── */
    let english = 'neutral';
    try {
      const emotion = await classifyEmotion(content);
      english = mapES[emotion.label] ?? emotion.label;
      await pool.query(
        `INSERT INTO emotions (message_id, label, score)
              VALUES ($1,$2,$3)`,
        [userMsg.rows[0].id, english, emotion.score],
      );
    } catch (err) {
      console.warn('Emotion service failed:', err);
      // seguimos: no cortamos el stream
    }

    /* Enviamos emoción al cliente */
    res.write(`event: emotion\ndata: ${english}\n\n`);

    /* ───────────── Contexto (últimas 3 sesiones) ─────────── */
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
        LIMIT 30`,
      [userId, sessionIds],
    );

    const prompt = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    /* ───────────── OpenAI stream ─────────── */
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

    /* Evento final + persistencia */
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

/* ────────────────────────────────────────────────
   REST ENDPOINTS PARA HISTÓRICO Y RESÚMENES
   ──────────────────────────────────────────────── */

/* Lista de últimas 50 sesiones */
router.get('/sessions', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT session_id,
            MIN(created_at) AS started_at,
            MAX(created_at) AS ended_at,
            COUNT(*) FILTER (WHERE role='assistant') AS answers
       FROM messages
      WHERE user_id = $1
   GROUP BY session_id
   ORDER BY ended_at DESC
      LIMIT 50`,
    [req.user.id],
  );
  res.json(rows);
});

/* Mensajes de una sesión */
router.get('/session/:id/messages', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT role, content, created_at
       FROM messages
      WHERE user_id = $1
        AND session_id = $2
   ORDER BY id`,
    [req.user.id, req.params.id],
  );
  res.json(rows);
});

/* Resumen de una sesión (2-3 frases) */
router.get('/session/:id/summary', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT role, content
       FROM messages
      WHERE user_id = $1
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

/* Cerrar sesión manualmente */
router.post('/end-session', authenticate, async (req, res) => {
  const { session_id } = req.body;
  /* Si no se manda session_id, cerramos la más reciente */
  const {
    rows: [{ session_id: latest }],
  } = await pool.query(
    `SELECT session_id
       FROM messages
      WHERE user_id = $1
   ORDER BY id DESC
      LIMIT 1`,
    [req.user.id],
  );

  const sid = session_id || latest;
  if (!sid) return res.status(400).send('No active session');

  await pool.query(
    `INSERT INTO messages (user_id, role, content, session_id)
          VALUES ($1,'assistant',$2,$3)`,
    [req.user.id, 'Session closed by user.', sid],
  );
  res.sendStatus(204);
});

export default router;
