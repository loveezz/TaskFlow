import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();
export const graphRouter = Router();

graphRouter.use(requireAuth);

// Возвращает граф связей задач для проекта или для корневой задачи
graphRouter.get('/tasks', async (req, res) => {
  const { projectId, rootTaskId } = req.query as { projectId?: string; rootTaskId?: string };
  let tasks;
  if (projectId) {
    tasks = await prisma.task.findMany({ where: { projectId }, include: { relationsParent: true, relationsChild: true } });
  } else if (rootTaskId) {
    tasks = await prisma.task.findMany({ include: { relationsParent: true, relationsChild: true } });
  } else {
    return res.status(400).json({ message: 'projectId or rootTaskId required' });
  }
  // Соберем ребра на основе TaskRelation
  const edges: { from: string; to: string }[] = [];
  const nodeIds = new Set(tasks.map((t: any) => t.id));
  const relations = await prisma.taskRelation.findMany({});
  for (const rel of relations) {
    if (nodeIds.has(rel.parentId) && nodeIds.has(rel.childId)) {
      edges.push({ from: rel.parentId, to: rel.childId });
    }
  }
  const nodes = tasks.map((t: any) => ({ id: t.id, label: t.title, status: t.status, priority: t.priority }));
  res.json({ nodes, edges });
});


