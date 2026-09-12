import { useEffect, useMemo, useRef, useState } from "react";
import { computeLayout } from "../layout";
import type { GraphData, GraphNode } from "../graph";

const WIDTH = 900;
const HEIGHT = 600;
const DRAG_THRESHOLD = 4;

const TYPE_COLORS: Record<GraphNode["type"], string> = {
  page: "#38bdf8",
  evidence: "#a78bfa",
  asset: "#2dd4bf",
  finding: "#9ca3af",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#60a5fa",
  none: "#9ca3af",
};

function colorFor(node: GraphNode): string {
  if (node.type === "finding") return SEVERITY_COLORS[node.severity ?? "none"];
  return TYPE_COLORS[node.type];
}

interface GraphViewProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
}

export function GraphView({ data, onNodeClick }: GraphViewProps) {
  const layout = useMemo(() => computeLayout(data, WIDTH, HEIGHT), [data]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragOverrides, setDragOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const dragState = useRef<{ id: string; moved: boolean } | null>(null);

  // Whenever new nodes/edges show up, drop any manual drag positions so the
  // whole graph reflects the fresh top-to-bottom layered layout instead of
  // mixing newly-placed nodes with stale hand-dragged ones.
  useEffect(() => {
    setDragOverrides({});
  }, [data]);

  const positioned = layout.map((node) => ({ ...node, ...(dragOverrides[node.id] ?? {}) }));
  const positionById = new Map(positioned.map((node) => [node.id, node]));

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const transformed = point.matrixTransform(ctm.inverse());
    return {
      x: Math.max(10, Math.min(WIDTH - 10, transformed.x)),
      y: Math.max(10, Math.min(HEIGHT - 10, transformed.y)),
    };
  };

  const handlePointerDown = (nodeId: string) => (event: React.PointerEvent<SVGGElement>) => {
    event.stopPropagation();
    dragState.current = { id: nodeId, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGGElement>) => {
    const drag = dragState.current;
    if (!drag) return;
    const point = toSvgPoint(event.clientX, event.clientY);
    const current = positionById.get(drag.id);
    if (current && !drag.moved) {
      const dx = point.x - current.x;
      const dy = point.y - current.y;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
    }
    setDragOverrides((prev) => ({ ...prev, [drag.id]: point }));
  };

  const handlePointerUp = (node: GraphNode) => (event: React.PointerEvent<SVGGElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    const drag = dragState.current;
    dragState.current = null;
    if (!drag?.moved) onNodeClick(node);
  };

  if (data.nodes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Nothing to show yet — link pages, evidence, and findings together (mentions, evidence
        chips, vulnerability notes) and they'll show up here.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-neutral-500">
        Click a node to open it. Drag a node to reposition it.
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full rounded-md border border-neutral-800 bg-neutral-950"
        style={{ height: HEIGHT }}
      >
        {data.edges.map((edge, index) => {
          const source = positionById.get(edge.source);
          const target = positionById.get(edge.target);
          if (!source || !target) return null;
          return (
            <line
              key={index}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#3f3f46"
              strokeWidth={1}
            />
          );
        })}
        {positioned.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onPointerDown={handlePointerDown(node.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp(node)}
            className="cursor-grab touch-none active:cursor-grabbing"
          >
            <circle r={10} fill={colorFor(node)} />
            <text
              y={22}
              textAnchor="middle"
              className="fill-neutral-300 text-[10px]"
              style={{ pointerEvents: "none" }}
            >
              {node.label.length > 20 ? `${node.label.slice(0, 20)}…` : node.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLORS.page }} /> Page
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLORS.evidence }} />{" "}
          Evidence
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLORS.asset }} /> Asset
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLORS.critical }} />{" "}
          Finding (colored by severity)
        </span>
      </div>
    </div>
  );
}
