import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';

import authRouter     from './routes/auth.js';
import messagesRouter from './routes/messages.js';
import statsRouter    from './routes/stats.js';

config();

/* ────────────────────────────────  express + middlewares  */
const app = express();
app.use(cors());
app.use(express.json());

/* ────────────────────────────────  routes  */
app.use('/auth',     authRouter);
app.use('/messages', messagesRouter);
app.use('/stats',    statsRouter);

app.get('/ping', (_, res) => res.json({ ok: true }));

/* ────────────────────────────────  http + socket.io  */
const server = createServer(app);

export const io = new Server(server, {
  cors: { origin: '*' },   // allow Vite dev-server
});

/* ────────────────────────────────  start  */
const PORT = process.env.PORT || 3000;

function startServer() {
  server.listen(PORT, () =>
    console.log(`API listening on http://localhost:${PORT}`)
  );
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(
      `Port ${PORT} is still in use — retrying in 1 s …`
    );
    setTimeout(() => server.close(startServer), 1000);
  } else {
    throw err;
  }
});

startServer();
