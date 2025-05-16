// Handle non-streaming message endpoint for production
router.post('/stream', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { content = '' } = req.body;
    if (!content.trim()) return res.status(400).send('Message cannot be empty');

    // Get or create session
    const { rows: latest } = await pool.query(
      `SELECT session_id, created_at FROM messages
       WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    const now = new Date();
    const lastSession = latest[0];
    const sameSession = lastSession && now - new Date(lastSession.created_at) < 1000 * 60 * 30;
    const sessionId = sameSession ? lastSession.session_id : randomUUID();

    // Save user message
    const userMsg = await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
       VALUES ($1, 'user', $2, $3) RETURNING id`,
      [userId, content, sessionId]
    );

    // Analyze emotion
    const emotion = await classifyEmotion(content);
    const english = mapES[emotion.label] ?? emotion.label;

    await pool.query(
      `INSERT INTO emotions (message_id, label, score)
       VALUES ($1, $2, $3)`,
      [userMsg.rows[0].id, english, emotion.score]
    );

    // Load last 3 sessions
    const { rows: recentSessions } = await pool.query(
      `SELECT session_id FROM messages
       WHERE user_id = $1
       GROUP BY session_id
       ORDER BY MAX(created_at) DESC
       LIMIT 3`,
      [userId]
    );

    const sessionIds = recentSessions.map((s) => s.session_id);
    if (sessionIds.length === 0) return res.status(500).send('No session history available');

    const { rows: history } = await pool.query(
      `SELECT role, content FROM messages
       WHERE user_id = $1 AND session_id = ANY($2)
       ORDER BY id ASC LIMIT 30`,
      [userId, sessionIds]
    );

    const prompt = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Call OpenAI for response
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: prompt,
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || '...';

    // Save assistant response
    await pool.query(
      `INSERT INTO messages (user_id, role, content, session_id)
       VALUES ($1, 'assistant', $2, $3)`,
      [userId, reply, sessionId]
    );

    // Return reply and emotion
    return res.json({
      reply,
      emotion: english,
    });
  } catch (err) {
    console.error('Non-stream error:', err.stack || err);
    return res.status(500).send('Failed to process message');
  }
});
