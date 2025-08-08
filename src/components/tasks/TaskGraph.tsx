import React, { useEffect, useMemo } from 'react';
import { fetchTaskGraph, type TaskGraph as TaskGraphType } from '../../lib/api';

interface TaskGraphProps {
  projectId?: string;
  rootTaskId?: string;
}

// Простая визуализация графа на SVG без сторонних либ
export function TaskGraph({ projectId, rootTaskId }: TaskGraphProps) {
  const [graph, setGraph] = React.useState<TaskGraphType | null>(null);

  useEffect(() => {
    fetchTaskGraph({ projectId, rootTaskId }).then(setGraph).catch(() => setGraph(null));
  }, [projectId, rootTaskId]);

  const layout = useMemo(() => {
    if (!graph) return { nodes: [] as Array<{ id: string; x: number; y: number; label?: string; status?: string; priority?: string }>, edges: [] as Array<{ from: string; to: string }> };
    // Простейшая раскладка по слоям: группируем по статусу
    const statusOrder: Record<string, number> = { 'todo': 0, 'in_progress': 1, 'review': 2, 'done': 3 };
    const grouped = new Map<number, typeof graph.nodes>();
    for (const n of graph.nodes) {
      const col = statusOrder[n.status] ?? 0;
      const arr = grouped.get(col) || [];
      arr.push(n);
      grouped.set(col, arr);
    }
    const columnWidth = 240;
    const rowHeight = 100;
    const nodesPos: Array<{ id: string; x: number; y: number; label: string; status: string; priority: string }> = [];
    for (const [col, nodes] of grouped.entries()) {
      nodes.forEach((n, idx) => {
        nodesPos.push({ id: n.id, x: col * columnWidth + 120, y: idx * rowHeight + 60, label: n.label, status: n.status, priority: n.priority });
      });
    }
    return { nodes: nodesPos, edges: graph.edges };
  }, [graph]);

  const width = 1000;
  const height = 600;

  if (!graph) {
    return <div className="text-sm text-gray-500">Loading graph…</div>;
  }

  return (
    <div className="w-full overflow-auto border rounded-lg bg-white">
      <svg width={width} height={height} className="block">
        {/* edges */}
        {layout.edges.map((e: { from: string; to: string }, i: number) => {
          const from = layout.nodes.find(n => n.id === e.from);
          const to = layout.nodes.find(n => n.id === e.to);
          if (!from || !to) return null;
          return (
            <g key={i}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#CBD5E1" strokeWidth={2} markerEnd="url(#arrow)" />
            </g>
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#CBD5E1" />
          </marker>
        </defs>
        {/* nodes */}
        {layout.nodes.map((n) => (
          <g key={n.id}>
            <rect x={n.x - 80} y={n.y - 24} rx={8} ry={8} width={160} height={48} fill="#111827" />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={12} fill="#FFFFFF">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}


