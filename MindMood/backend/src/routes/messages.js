import { Router } from 'express';
import { pool } from '../services/db.js';
import { authenticate } from '../middlewares/auth.js';
import { openai } from '../services/openai.js';
import { classifyEmotion } from '../services/emotion.js';
import { randomUUID } from 'crypto';

const router = Router();

const mapES = {
  alegría: 'joy',
  tristeza: 'sadness',
  ira: 'anger',
  miedo: 'fear',
  sorpresa: 'surprise',
  neutral: 'neutral',
};

const systemPrompt = `
You are an empathetic psychologist. When a user starts a conversation, begin with a brief, caring follow-up question to explore their feelings.
If they express distress or mental health concerns, encourage them gently to seek professional help.
Once you understand the situation better, offer practical emotional support and short advice based on CBT or mindfulness.
Always keep your tone supportive and understanding.
`;

// Handle new message with streaming response
router.post('/stream', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content = '' } = req.body;
    if (!content.trim()) return res.status(400).send('Message cannot be empty');

    const { rows: latest } = await pool.query(
      `SELECT session_id, created_at FROM messages
       WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    const now = new Date();
    const lastSession = latest[0];
    const sameSession = lastSession && now - new Date(lastSession.created_at) < 1000 * 60 * 30;
    const sessionId = sameSession ? lastSession.session_id : randomUUID();

    const userMsg = await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
       VALUES ($1, 'user', $2, $3) RETURNING id`,
      [userId, content, sessionId]
    );

    const emotion = await classifyEmotion(content);
    const english = mapES[emotion.label] ?? emotion.label;

    await pool.query(
      `INSERT INTO emotions (message_id, label, score)
       VALUES ($1, $2, $3)`,
      [userMsg.rows[0].id, english, emotion.score]
    );

    const { rows: recentSessions } = await pool.query(
      `SELECT session_id FROM messages
       WHERE user_id = $1
       GROUP BY session_id
       ORDER BY MAX(created_at) DESC
       LIMIT 3`,
      [userId]
    );

    const sessionIds = recentSessions.map((s) => s.session_id);

    const { rows: history } = await pool.query(
      `SELECT role, content FROM messages
       WHERE user_id = $1 AND session_id = ANY($2)
       ORDER BY id ASC`,
      [userId, sessionIds]
    );

    const prompt = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`event: emotion\ndata: ${english}\n\n`);

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      stream: true,
      messages: prompt,
    });

    let assistantReply = '';
    for await (const part of stream) {
      const delta = part.choices[0].delta?.content || '';
      assistantReply += delta;
      res.write(`data: ${delta}\n\n`);
    }

    res.write('event: end\ndata: done\n\n');
    res.end();

    await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
       VALUES ($1, 'assistant', $2, $3)`,
      [userId, assistantReply, sessionId]
    );
  } catch (err) {
    console.error('Streaming error:', err.stack || err);
    res.end();
  }
});

router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT session_id, MIN(created_at) AS date
       FROM messages
       WHERE user_id = $1
       GROUP BY session_id
       ORDER BY date DESC
       LIMIT 5`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Session fetch error:', err.stack || err);
    res.status(500).send('Failed to load sessions');
  }
});

router.get('/session/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT role, content FROM messages
       WHERE user_id = $1 AND session_id = $2
       ORDER BY id ASC`,
      [req.user.id, id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Session messages error:', err.stack || err);
    res.status(500).send('Failed to load messages');
  }
});

router.get('/session/:id/summary', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { rows: messages } = await pool.query(
      `SELECT content FROM messages
       WHERE session_id = $1 AND user_id = $2
       ORDER BY id ASC`,
      [id, userId]
    );

    const fullText = messages.map((m) => m.content).join('\n');

    const prompt = [
      {
        role: 'system',
        content: 'You are an assistant that summarizes therapy-style chats in one helpful sentence. Focus on emotion and reasons.',
      },
      {
        role: 'user',
        content: 'Summarize this conversation in 1 sentence:\n\n' + fullText,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: prompt,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) return res.status(500).send('No summary generated');
    res.json({ summary });
  } catch (err) {
    console.error('Summary generation error:', err.stack || err);
    res.status(500).send('Failed to generate summary');
  }
});

// ✅ New: Generate summary by date
router.get('/summary/by-day/:date', authenticate, async (req, res) => {
  const { date } = req.params;
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT content FROM messages
       WHERE user_id = $1 AND created_at::date = $2::date
       ORDER BY id`,
      [userId, date]
    );

    if (rows.length === 0) return res.status(404).send('No messages found for that date');

    const fullText = rows.map((r) => r.content).join('\n');

    const prompt = [
      { role: 'system', content: 'You are an assistant that summarizes therapy-style chat from a day in 1 sentence.' },
      { role: 'user', content: 'Summarize this day\'s conversation:\n\n' + fullText },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: prompt,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) return res.status(500).send('No summary generated');

    res.json({ summary });
  } catch (err) {
    console.error('Summary by day error:', err.stack || err);
    res.status(500).send('Failed to generate summary');
  }
});

router.post('/end-session', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const farewell = 'Thank you for sharing. This conversation has been saved. Feel free to return anytime.';

    const { rows: latest } = await pool.query(
      `SELECT session_id FROM messages
       WHERE user_id = $1
       ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    const lastSession = latest[0];
    if (!lastSession) return res.status(400).send('No session to close');

    await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
       VALUES ($1, 'assistant', $2, $3)`,
      [userId, farewell, lastSession.session_id]
    );

    res.send({ status: 'closed', message: farewell });
  } catch (err) {
    console.error('End session error:', err.stack || err);
    res.status(500).send('Failed to close session');
  }
});

export default router;
