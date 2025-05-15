import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';

import authRouter from './routes/auth.js';
import messagesRouter from './routes/messages.js';
import statsRouter from './routes/stats.js';

config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/messages', messagesRouter);
app.use('/stats', statsRouter);

app.get('/ping', (_, res) => res.json({ ok: true }));

const server = createServer(app);

export const io = new Server(server, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
