require('dotenv/config');
import express = require('express');
import cors = require('cors');
import cookieParser = require('cookie-parser');
import http = require('http');
import { authRouter } from './routes/auth';
import { tasksRouter } from './routes/tasks';
import { dashboardRouter } from './routes/dashboard';
import { chatRouter } from './routes/chat';
import { setupSocket } from './socket';
import { projectsRouter } from './routes/projects';
import { graphRouter } from './routes/graph';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/chat', chatRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/graph', graphRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const server = http.createServer(app);
setupSocket(server);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Magnesium API listening on http://localhost:${port}`);
});

