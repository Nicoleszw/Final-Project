// messages.js
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
If they express distress or mental-health concerns, encourage them gently to seek professional help.
Once you understand the situation better, offer practical emotional support and short advice based on CBT or mindfulness.
Always keep your tone supportive and understanding.
`;

// STREAMING ENDPOINT (SSE)
router.post('/stream', authenticate, async (req, res) => {
  // 1️⃣  HEADERS FOR SERVER-SENT EVENTS
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  req.socket.setTimeout(0);

  const ping = setInterval(() => res.write(':\n\n'), 30_000); // heartbeat

  try {
    const userId = req.user.id;
    const { content = '' } = req.body;
    if (!content.trim()) {
      res.write('event: error\ndata: Empty message\n\n');
      return res.end();
    }

    /** ────── SESSION HANDLING ────── */
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

    /** ────── SAVE USER MESSAGE ────── */
    const userMsg = await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
            VALUES ($1, 'user', $2, $3)
         RETURNING id`,
      [userId, content, sessionId],
    );

    /** ────── EMOTION CLASSIFICATION ────── */
    const emotion = await classifyEmotion(content);
    const english = mapES[emotion.label] ?? emotion.label;

    await pool.query(
      `INSERT INTO emotions (message_id, label, score)
            VALUES ($1, $2, $3)`,
      [userMsg.rows[0].id, english, emotion.score],
    );

    /** ────── CONTEXT: LAST 3 SESSIONS ────── */
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
     ORDER BY id ASC
        LIMIT 30`,
      [userId, sessionIds],
    );

    const prompt = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    /** ────── SEND EMOTION TO CLIENT ────── */
    res.write(`event: emotion\ndata: ${english}\n\n`);

    /** ────── OPENAI STREAM ────── */
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

    /** ────── END EVENT & SAVE REPLY ────── */
    res.write('event: end\ndata: [DONE]\n\n');
    await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
            VALUES ($1, 'assistant', $2, $3)`,
      [userId, assistantText.trim(), sessionId],
    );
    res.end();
  } catch (err) {
    console.error('Streaming error:', err);
    if (!res.headersSent) res.writeHead(500);
    res.write(`event: error\ndata: ${err.message}\n\n`);
    res.end();
  } finally {
    clearInterval(ping);
  }
});

/* ---------- REMAINDER OF ROUTES (SIN CAMBIOS) ---------- */
router.get('/sessions', authenticate, async (req, res) => { /* … */ });
router.get('/session/:id/messages', authenticate, async (req, res) => { /* … */ });
router.get('/session/:id/summary', authenticate, async (req, res) => { /* … */ });
router.get('/summary/by-day/:date', authenticate, async (req, res) => { /* … */ });
router.post('/end-session', authenticate, async (req, res) => { /* … */ });

export default router;
