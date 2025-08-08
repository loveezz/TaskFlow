import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
export const tasksRouter = Router();

const baseTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['low','medium','high','urgent']).default('medium'),
  status: z.enum(['todo','in_progress','review','done']).default('todo'),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
});

tasksRouter.use(requireAuth);

tasksRouter.get('/', async (req, res) => {
  const tasks = await prisma.task.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { assignee: true, project: true }
  });
  res.json({ tasks });
});

tasksRouter.post('/', async (req, res) => {
  const parse = baseTaskSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Invalid data' });
  const data = parse.data;
  let projectId = data.projectId;
  if (!projectId) {
    const project = await prisma.project.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default', name: 'General', description: 'Default project', color: 'bg-blue-100' },
    });
    projectId = project.id;
  }
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      tags: data.tags,
      projectId,
      assigneeId: data.assigneeId,
    },
  });
  res.json({ task });
});

tasksRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const parse = baseTaskSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Invalid data' });
  const data = parse.data;
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
  res.json({ task });
});

tasksRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.task.delete({ where: { id } });
  res.json({ ok: true });
});

tasksRouter.get('/:id/comments', async (req, res) => {
  const { id } = req.params;
  const comments = await prisma.comment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: 'asc' },
    include: { author: true }
  });
  res.json({ comments });
});

tasksRouter.post('/:id/comments', async (req, res) => {
  const { id } = req.params;
  const schema = z.object({ content: z.string().min(1) });
  const parse = schema.safeParse(req.body);
  if (!parse.success || !req.user) return res.status(400).json({ message: 'Invalid data' });
  const comment = await prisma.comment.create({
    data: {
      content: parse.data.content,
      taskId: id,
      authorId: req.user.sub,
    }
  });
  res.json({ comment });
});

