import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { readEvidenceBlob } from "../evidence.service";
import type { Evidence } from "../evidence.types";
import { useDeriveEvidence } from "../useEvidence";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RedactEvidenceModalProps {
  open: boolean;
  entry: CatalogEntry;
  evidence: Evidence;
  onClose: () => void;
  onSaved: () => void;
}

export function RedactEvidenceModal({
  open,
  entry,
  evidence,
  onClose,
  onSaved,
}: RedactEvidenceModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [draftBox, setDraftBox] = useState<Box | null>(null);
  const deriveEvidence = useDeriveEvidence(entry);

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !img || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    for (const box of boxes) ctx.fillRect(box.x, box.y, box.w, box.h);
    if (draftBox) ctx.fillRect(draftBox.x, draftBox.y, draftBox.w, draftBox.h);
  };

  useEffect(() => {
    if (!open) {
      setBoxes([]);
      setDraftBox(null);
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
  }, [boxes, draftBox]);

  const toCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = toCanvasPoint(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    const point = toCanvasPoint(event);
    setDraftBox({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    });
  };

  const handlePointerUp = () => {
    if (draftBox && draftBox.w > 2 && draftBox.h > 2) {
      setBoxes((prev) => [...prev, draftBox]);
    }
    setDraftBox(null);
    dragStartRef.current = null;
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const baseName = evidence.originalName?.replace(/\.[^./]+$/, "") ?? evidence.id.slice(0, 8);
    await deriveEvidence.mutateAsync({
      blob,
      originalName: `${baseName}-redacted.png`,
      derivedFromId: evidence.id,
    });
    onSaved();
  };

  return (
    <Modal open={open} title="Redact evidence" onClose={onClose} size="xl">
      <div className="space-y-3">
        <p className="text-xs text-neutral-500">
          Drag on the image to draw black boxes over anything sensitive (PII, credentials,
          internal hostnames). This saves a brand new evidence file — the original is never
          modified, per the immutable-evidence rule.
        </p>
        <div className="max-h-[60vh] overflow-auto rounded-md border border-neutral-800 bg-neutral-950">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="block max-w-full cursor-crosshair touch-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="text-xs"
              disabled={boxes.length === 0}
              onClick={() => setBoxes((prev) => prev.slice(0, -1))}
            >
              Undo last box
            </Button>
            <Button
              variant="secondary"
              className="text-xs"
              disabled={boxes.length === 0}
              onClick={() => setBoxes([])}
            >
              Clear all
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={boxes.length === 0 || deriveEvidence.isPending} onClick={handleSave}>
              {deriveEvidence.isPending ? "Saving…" : "Save as redacted copy"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
