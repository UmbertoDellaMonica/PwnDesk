import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { readEvidenceBlob } from "../evidence.service";
import type { Evidence } from "../evidence.types";
import { useDeriveEvidence } from "../useEvidence";
import type { AnnotationShape, AnnotationTool } from "../annotation.types";

interface Point {
  x: number;
  y: number;
}

interface AnnotateEvidenceModalProps {
  open: boolean;
  entry: CatalogEntry;
  evidence: Evidence;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_COLOR = "#ef4444"; // red-500 — visible against most screenshots
const SELECTION_COLOR = "#38bdf8"; // sky-400

type UiTool = AnnotationTool | "select";
type ToolButtonId = "select" | "outline" | "highlight" | "arrow";

const TOOL_BUTTONS: { id: ToolButtonId; label: string }[] = [
  { id: "select", label: "Select/Edit" },
  { id: "outline", label: "Outline" },
  { id: "highlight", label: "Highlight" },
  { id: "arrow", label: "Arrow" },
];

function drawArrowhead(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string) {
  const headLength = 14;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLength * Math.cos(angle - Math.PI / 6),
    to.y - headLength * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    to.x - headLength * Math.cos(angle + Math.PI / 6),
    to.y - headLength * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawShape(ctx: CanvasRenderingContext2D, shape: AnnotationShape) {
  switch (shape.tool) {
    case "rect":
      if (shape.style === "highlight") {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = shape.color;
        ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
      }
      return;
    case "arrow": {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      drawArrowhead(ctx, { x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }, shape.color);
      return;
    }
  }
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

// A "handle" is a draggable control point rendered on the selected shape —
// corners for boxes, endpoints for arrows. Dragging one resizes/reshapes the
// shape instead of moving it wholesale.
function getHandles(shape: AnnotationShape): { id: string; point: Point }[] {
  switch (shape.tool) {
    case "rect":
      return [
        { id: "nw", point: { x: shape.x, y: shape.y } },
        { id: "ne", point: { x: shape.x + shape.w, y: shape.y } },
        { id: "sw", point: { x: shape.x, y: shape.y + shape.h } },
        { id: "se", point: { x: shape.x + shape.w, y: shape.y + shape.h } },
      ];
    case "arrow":
      return [
        { id: "p1", point: { x: shape.x1, y: shape.y1 } },
        { id: "p2", point: { x: shape.x2, y: shape.y2 } },
      ];
  }
}

function hitTestBody(shape: AnnotationShape, point: Point, radius: number): boolean {
  switch (shape.tool) {
    case "rect":
      return (
        point.x >= shape.x - radius &&
        point.x <= shape.x + shape.w + radius &&
        point.y >= shape.y - radius &&
        point.y <= shape.y + shape.h + radius
      );
    case "arrow":
      return distanceToSegment(point, { x: shape.x1, y: shape.y1 }, { x: shape.x2, y: shape.y2 }) <= radius;
  }
}

function moveShape(shape: AnnotationShape, dx: number, dy: number): AnnotationShape {
  switch (shape.tool) {
    case "rect":
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case "arrow":
      return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
  }
}

function resizeShape(shape: AnnotationShape, handle: string, point: Point): AnnotationShape {
  switch (shape.tool) {
    case "rect": {
      const x2 = shape.x + shape.w;
      const y2 = shape.y + shape.h;
      const nx = handle.includes("w") ? point.x : shape.x;
      const nx2 = handle.includes("e") ? point.x : x2;
      const ny = handle.includes("n") ? point.y : shape.y;
      const ny2 = handle.includes("s") ? point.y : y2;
      return {
        ...shape,
        x: Math.min(nx, nx2),
        y: Math.min(ny, ny2),
        w: Math.abs(nx2 - nx),
        h: Math.abs(ny2 - ny),
      };
    }
    case "arrow":
      return handle === "p1" ? { ...shape, x1: point.x, y1: point.y } : { ...shape, x2: point.x, y2: point.y };
  }
}

function drawSelectionOutline(ctx: CanvasRenderingContext2D, shape: AnnotationShape) {
  if (shape.tool === "rect") ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
}

export function AnnotateEvidenceModal({
  open,
  entry,
  evidence,
  onClose,
  onSaved,
}: AnnotateEvidenceModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const [shapes, setShapes] = useState<AnnotationShape[]>([]);
  const [draftShape, setDraftShape] = useState<AnnotationShape | null>(null);
  const [activeTool, setActiveTool] = useState<UiTool>("rect");
  const [rectStyle, setRectStyle] = useState<"outline" | "highlight">("outline");
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectDragRef = useRef<{
    mode: "move" | "resize";
    handle?: string;
    start: Point;
    original: AnnotationShape;
  } | null>(null);
  const deriveEvidence = useDeriveEvidence(entry);

  const getScale = (canvas: HTMLCanvasElement) => canvas.width / canvas.getBoundingClientRect().width;

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !img || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const shape of shapes) drawShape(ctx, shape);
    if (draftShape) drawShape(ctx, draftShape);

    const selected = selectedIndex !== null ? shapes[selectedIndex] : null;
    if (selected) {
      const scale = getScale(canvas);
      ctx.save();
      ctx.strokeStyle = SELECTION_COLOR;
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([6 * scale, 4 * scale]);
      drawSelectionOutline(ctx, selected);
      ctx.restore();
      ctx.fillStyle = SELECTION_COLOR;
      const handleRadius = 5 * scale;
      for (const handle of getHandles(selected)) {
        ctx.beginPath();
        ctx.arc(handle.point.x, handle.point.y, handleRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    if (!open) {
      setShapes([]);
      setDraftShape(null);
      setActiveTool("rect");
      setSelectedIndex(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    readEvidenceBlob(`${entry.folderPath}/evidence`, evidence).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        imageRef.current = img;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }
        redraw();
      };
      img.src = objectUrl;
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, evidence.id]);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, draftShape, selectedIndex]);

  const toCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (activeTool === "select") {
      if (!canvas) return;
      const point = toCanvasPoint(event);
      const radius = 8 * getScale(canvas);

      if (selectedIndex !== null) {
        const selected = shapes[selectedIndex];
        const handle = getHandles(selected).find(
          (h) => Math.hypot(point.x - h.point.x, point.y - h.point.y) <= radius * 1.5,
        );
        if (handle) {
          event.currentTarget.setPointerCapture(event.pointerId);
          selectDragRef.current = { mode: "resize", handle: handle.id, start: point, original: selected };
          return;
        }
      }

      for (let i = shapes.length - 1; i >= 0; i--) {
        if (hitTestBody(shapes[i], point, radius)) {
          setSelectedIndex(i);
          event.currentTarget.setPointerCapture(event.pointerId);
          selectDragRef.current = { mode: "move", start: point, original: shapes[i] };
          return;
        }
      }
      setSelectedIndex(null);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = toCanvasPoint(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === "select") {
      const drag = selectDragRef.current;
      if (!drag || selectedIndex === null) return;
      const point = toCanvasPoint(event);
      const dx = point.x - drag.start.x;
      const dy = point.y - drag.start.y;
      const updated =
        drag.mode === "move" ? moveShape(drag.original, dx, dy) : resizeShape(drag.original, drag.handle!, point);
      setShapes((prev) => prev.map((shape, i) => (i === selectedIndex ? updated : shape)));
      return;
    }

    const start = dragStartRef.current;
    if (!start) return;
    const point = toCanvasPoint(event);
    if (activeTool === "arrow") {
      setDraftShape({ tool: "arrow", x1: start.x, y1: start.y, x2: point.x, y2: point.y, color: activeColor });
      return;
    }
    const box = {
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    };
    if (activeTool === "rect") {
      setDraftShape({ tool: "rect", ...box, color: activeColor, style: rectStyle });
    }
  };

  const handlePointerUp = () => {
    if (activeTool === "select") {
      selectDragRef.current = null;
      return;
    }
    dragStartRef.current = null;
    if (!draftShape) return;
    const isBox = draftShape.tool === "rect";
    const isArrow = draftShape.tool === "arrow";
    const bigEnough =
      (isBox && "w" in draftShape && draftShape.w > 2 && draftShape.h > 2) ||
      (isArrow && "x1" in draftShape && Math.hypot(draftShape.x2 - draftShape.x1, draftShape.y2 - draftShape.y1) > 2);
    if (bigEnough) setShapes((prev) => [...prev, draftShape]);
    setDraftShape(null);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSelectedIndex(null);
    // Selection handles are drawn on the canvas — clear the selection and
    // let the resulting redraw settle before exporting, so they never end up
    // baked into the saved PNG.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const baseName = evidence.originalName?.replace(/\.[^./]+$/, "") ?? evidence.id.slice(0, 8);
    await deriveEvidence.mutateAsync({
      blob,
      originalName: `${baseName}-annotated.png`,
      derivedFromId: evidence.id,
    });
    onSaved();
  };

  const activeButtonId: ToolButtonId = activeTool === "rect" ? rectStyle : (activeTool as ToolButtonId);

  const selectTool = (id: ToolButtonId) => {
    if (id === "select") {
      setActiveTool("select");
      return;
    }
    setSelectedIndex(null);
    if (id === "outline" || id === "highlight") {
      setActiveTool("rect");
      setRectStyle(id);
    } else {
      setActiveTool(id as AnnotationTool);
    }
  };

  const selectedShape = selectedIndex !== null ? shapes[selectedIndex] : null;
  const showColorSwatch = activeTool !== "select" || selectedShape !== null;
  const colorValue = selectedShape ? selectedShape.color : activeColor;

  const handleColorChange = (value: string) => {
    if (selectedShape && selectedIndex !== null) {
      setShapes((prev) => prev.map((shape, i) => (i === selectedIndex ? { ...shape, color: value } : shape)));
    } else {
      setActiveColor(value);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIndex === null) return;
    setShapes((prev) => prev.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
  };

  return (
    <Modal open={open} title="Annotate evidence" onClose={onClose} size="xl">
      <div className="space-y-3">
        <p className="text-xs text-neutral-500">
          Outline/highlight/arrow point out what matters. Use Select/Edit to click a shape you
          already placed and drag its handles or body, or change its color, before saving. This
          always saves a brand new evidence file — the original is never modified, per the
          immutable-evidence rule.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {TOOL_BUTTONS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => selectTool(tool.id)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                activeButtonId === tool.id
                  ? "bg-emerald-700 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {tool.label}
            </button>
          ))}
          {showColorSwatch && (
            <label className="ml-auto flex items-center gap-1.5 text-xs text-neutral-400">
              Color
              <input
                type="color"
                value={colorValue}
                onChange={(event) => handleColorChange(event.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-neutral-700 bg-transparent"
              />
            </label>
          )}
        </div>

        <div className="relative max-h-[60vh] overflow-auto rounded-md border border-neutral-800 bg-neutral-950">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`block max-w-full touch-none ${activeTool === "select" ? "cursor-default" : "cursor-crosshair"}`}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="text-xs"
              disabled={shapes.length === 0}
              onClick={() => setShapes((prev) => prev.slice(0, -1))}
            >
              Undo last
            </Button>
            <Button
              variant="secondary"
              className="text-xs"
              disabled={shapes.length === 0}
              onClick={() => setShapes([])}
            >
              Clear all
            </Button>
            {selectedIndex !== null && (
              <Button variant="secondary" className="text-xs" onClick={handleDeleteSelected}>
                Delete selected
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={shapes.length === 0 || deriveEvidence.isPending} onClick={handleSave}>
              {deriveEvidence.isPending ? "Saving…" : "Save as annotated copy"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
