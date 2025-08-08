import { Router } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/stats', async (_req, res) => {
  const [projectsCount, tasks, completedTasks] = await Promise.all([
    prisma.project.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: TaskStatus.done } })
  ]);
  const pendingTasks = tasks - completedTasks;
  const completionRate = tasks === 0 ? 0 : Math.round((completedTasks / tasks) * 100);
  res.json({
    projectsCount,
    tasks,
    completedTasks,
    pendingTasks,
    completionRate
  });
});

