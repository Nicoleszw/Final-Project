import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';

import authRouter from './routes/auth.js';
import messagesRouter from './routes/messages.js';
import statsRouter from './routes/stats.js';

config();

const app = express();

/* ─────────────── CORS ─────────────── */
const allowed = (process.env.FRONTEND_URL || '*').split(',');
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes('*') || allowed.includes(origin)) cb(null, true);
      else cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.set('trust proxy', 1);
app.use(express.json());

/* ─────────────── Routes ─────────────── */
app.use('/auth', authRouter);
app.use('/messages', messagesRouter);
app.use('/stats', statsRouter);
app.get('/ping', (_, res) => res.json({ ok: true }));

/* ─────────────── HTTP & Socket.io ─────────────── */
const server = createServer(app);
export const io = new SocketServer(server, {
  cors: { origin: allowed, credentials: true },
});

/* Render cierra sockets a los 60 s si no hay tráfico;
   ampliamos límites para el streaming SSE */
server.keepAliveTimeout = 65_000; // 65 s
server.headersTimeout  = 70_000; // 70 s

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`API listening on ${PORT}`));
