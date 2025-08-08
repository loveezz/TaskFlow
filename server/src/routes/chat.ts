import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get('/channels', async (req, res) => {
  const { taskId, projectId } = req.query as { taskId?: string; projectId?: string };
  const where: any = {};
  if (taskId) where.taskId = taskId;
  if (projectId) where.projectId = projectId;
  const channels = await prisma.chatChannel.findMany({ where, orderBy: { createdAt: 'asc' } });
  res.json({ channels });
});

chatRouter.post('/channels', async (req, res) => {
  const schema = z.object({ name: z.string().min(1), description: z.string().optional(), type: z.enum(['public','private','direct']).default('public'), taskId: z.string().optional(), projectId: z.string().optional() });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Invalid data' });
  const channel = await prisma.chatChannel.create({ data: parse.data });
  res.json({ channel });
});

chatRouter.get('/channels/:id/messages', async (req, res) => {
  const { id } = req.params;
  const messages = await prisma.message.findMany({ where: { channelId: id }, orderBy: { createdAt: 'asc' }, include: { author: true } });
  res.json({ messages });
});

chatRouter.post('/channels/:id/messages', async (req, res) => {
  const { id } = req.params;
  const schema = z.object({ content: z.string().min(1) });
  const parse = schema.safeParse(req.body);
  if (!parse.success || !req.user) return res.status(400).json({ message: 'Invalid data' });
  const message = await prisma.message.create({ data: { content: parse.data.content, channelId: id, authorId: req.user.sub } });
  res.json({ message });
});

