import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get('/', async (_req, res) => {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        where: { status: 'done' },
        select: { id: true },
      },
    },
    orderBy: { updatedAt: 'desc' }
  });

  const result = projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    members: [],
    tasksCount: p._count.tasks,
    completedTasks: p.tasks.length,
  }));

  res.json({ projects: result });
});


