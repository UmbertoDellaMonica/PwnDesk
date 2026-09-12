import type { GraphData, GraphNode } from "./graph";

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

/**
 * Layered top-to-bottom layout: each node's level is its longest-path
 * distance from a root (a node nothing else points to — e.g. a page nobody
 * mentions). This matches the app's own referencer -> referenced direction
 * (page -> finding/evidence/asset, finding -> evidence/asset), so pages
 * naturally end up above what they reference, and a finding above the
 * evidence it cites. Nodes sharing a level are spread evenly across a
 * horizontal band; levels stack downward.
 */
export function computeLayout(
  { nodes, edges }: GraphData,
  width: number,
  height: number,
): PositionedNode[] {
  if (nodes.length === 0) return [];

  const nodeIds = nodes.map((node) => node.id);
  const children = new Map<string, string[]>();
  const remainingInDegree = new Map<string, number>();
  for (const id of nodeIds) {
    children.set(id, []);
    remainingInDegree.set(id, 0);
  }
  for (const edge of edges) {
    if (!children.has(edge.source) || !remainingInDegree.has(edge.target)) continue;
    children.get(edge.source)!.push(edge.target);
    remainingInDegree.set(edge.target, (remainingInDegree.get(edge.target) ?? 0) + 1);
  }

  const level = new Map<string, number>();
  const queue: string[] = [];
  const queued = new Set<string>();
  for (const id of nodeIds) {
    if (remainingInDegree.get(id) === 0) {
      level.set(id, 0);
      queue.push(id);
      queued.add(id);
    }
  }

  // Kahn's topological sort, propagating level = max(parent levels) + 1 so a
  // node reachable via several paths lands below all of its parents, not
  // just the first one processed.
  let cursor = 0;
  while (cursor < queue.length) {
    const id = queue[cursor++];
    const parentLevel = level.get(id) ?? 0;
    for (const childId of children.get(id) ?? []) {
      const candidateLevel = parentLevel + 1;
      if ((level.get(childId) ?? -1) < candidateLevel) level.set(childId, candidateLevel);
      const remaining = (remainingInDegree.get(childId) ?? 0) - 1;
      remainingInDegree.set(childId, remaining);
      if (remaining <= 0 && !queued.has(childId)) {
        queue.push(childId);
        queued.add(childId);
      }
    }
  }

  // Anything left over is part of a cycle the topological sort couldn't
  // order — rather than dropping it, seed it as its own root at level 0.
  for (const id of nodeIds) {
    if (!level.has(id)) level.set(id, 0);
  }

  const byLevel = new Map<number, string[]>();
  for (const id of nodeIds) {
    const lvl = level.get(id) ?? 0;
    const bucket = byLevel.get(lvl);
    if (bucket) bucket.push(id);
    else byLevel.set(lvl, [id]);
  }

  const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
  const topMargin = 40;
  const levelHeight = levels.length > 1 ? (height - topMargin * 2) / (levels.length - 1) : 0;

  const positions = new Map<string, { x: number; y: number }>();
  levels.forEach((lvl, levelIndex) => {
    const idsAtLevel = byLevel.get(lvl) ?? [];
    const y = levels.length > 1 ? topMargin + levelIndex * levelHeight : height / 2;
    const step = width / (idsAtLevel.length + 1);
    idsAtLevel.forEach((id, index) => {
      positions.set(id, { x: step * (index + 1), y });
    });
  });

  return nodes.map((node) => ({ ...node, ...positions.get(node.id)! }));
}
