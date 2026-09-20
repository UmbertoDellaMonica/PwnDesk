import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import { errorMessage } from "../../../shared/lib/errorMessage";
import { showToast } from "../../../shared/ui/toastStore";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { useCaptureEvidence } from "../useEvidence";
import {
  captureTarget,
  clipboardImageSignature,
  listCaptureTargets,
  readClipboardImagePng,
  triggerNativeSnip,
  type CaptureTarget,
} from "../screenshotCapture";

interface Point {
  x: number;
  y: number;
}

interface CaptureScreenshotModalProps {
  open: boolean;
  entry: CatalogEntry;
  onClose: () => void;
}

type Step = "pick" | "waiting-for-selection" | "crop";

const POLL_INTERVAL_MS = 500;

export function CaptureScreenshotModal({ open, entry, onClose }: CaptureScreenshotModalProps) {
  const [step, setStep] = useState<Step>("pick");
  const [targets, setTargets] = useState<CaptureTarget[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );

  const captureEvidence = useCaptureEvidence(entry);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      setStep("pick");
      setTargets([]);
      setError(null);
      setSelection(null);
      imageRef.current = null;
      stopPolling();
      return;
    }
    setLoadingTargets(true);
    listCaptureTargets()
      .then(setTargets)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoadingTargets(false));
  }, [open]);

  useEffect(() => () => stopPolling(), []);

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !img || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (selection) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
    }
  };

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  // The canvas only exists in the DOM once step === "crop", so sizing/drawing
  // it has to happen after that render commits, not inside handlePick's
  // img.onload (which fires while step is still "pick" and canvasRef is null).
  useEffect(() => {
    if (step !== "crop") return;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const loadCapturedBlob = (blob: Blob) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setSelection(null);
      setStep("crop");
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handlePick = async (target: CaptureTarget) => {
    setCapturing(true);
    setError(null);
    try {
      const blob = await captureTarget(target.kind, target.id);
      loadCapturedBlob(blob);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCapturing(false);
    }
  };

  // Delegates region selection to Windows' own Snip & Sketch tool (same UI as
  // PrtScn / Win+Shift+S) instead of a custom overlay window. Snip & Sketch
  // copies the selection to the clipboard when the user finishes dragging, so
  // this just polls for a change from whatever was on the clipboard before
  // launching it.
  const handleSelectArea = async () => {
    setError(null);
    try {
      const baseline = await clipboardImageSignature();
      await triggerNativeSnip();
      setStep("waiting-for-selection");
      pollTimerRef.current = setInterval(async () => {
        try {
          const current = await clipboardImageSignature();
          if (current === null || current === baseline) return;
          stopPolling();
          const blob = await readClipboardImagePng();
          loadCapturedBlob(blob);
        } catch (err) {
          stopPolling();
          setError(errorMessage(err));
          setStep("pick");
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleCancelSelection = () => {
    stopPolling();
    setStep("pick");
  };

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
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = toCanvasPoint(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    const point = toCanvasPoint(event);
    setSelection({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    });
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
    if (selection && (selection.w <= 2 || selection.h <= 2)) setSelection(null);
  };

  const saveBlob = async (blob: Blob) => {
    try {
      await captureEvidence.mutateAsync({
        file: blob,
        initialData: { category: "screenshot" },
      });
      showToast("Screenshot captured");
      onClose();
    } catch (err) {
      showToast(`Failed to save screenshot: ${errorMessage(err)}`, "error");
    }
  };

  const handleUseFullImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Redraw without the selection outline before exporting.
    const img = imageRef.current;
    const ctx = canvas.getContext("2d");
    if (img && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) await saveBlob(blob);
  };

  const handleCropToSelection = async () => {
    const img = imageRef.current;
    if (!img || !selection) return;
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = selection.w;
    cropCanvas.height = selection.h;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, selection.x, selection.y, selection.w, selection.h, 0, 0, selection.w, selection.h);
    const blob = await new Promise<Blob | null>((resolve) => cropCanvas.toBlob(resolve, "image/png"));
    if (blob) await saveBlob(blob);
  };

  return (
    <Modal open={open} title="Capture screenshot" onClose={onClose} size="xl">
      <div className="space-y-3">
        {error && <p className="text-xs text-red-400">{error}</p>}

        {step === "pick" && (
          <>
            <div className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2">
              <p className="text-xs text-neutral-400">
                Draw a region anywhere on screen using Windows' own selection tool.
              </p>
              <Button type="button" onClick={handleSelectArea}>
                Select area…
              </Button>
            </div>

            <p className="text-xs text-neutral-500">…or capture a whole monitor/window directly:</p>
            {loadingTargets && <p className="text-xs text-neutral-500">Loading targets…</p>}
            {!loadingTargets && targets.length === 0 && !error && (
              <p className="text-xs text-neutral-600">No capture targets found.</p>
            )}
            <div className="max-h-[40vh] space-y-1 overflow-y-auto">
              {targets.map((target) => (
                <button
                  key={`${target.kind}-${target.id}`}
                  type="button"
                  disabled={capturing}
                  onClick={() => handlePick(target)}
                  className="flex w-full items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-left text-sm text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
                >
                  <span className="truncate">{target.label}</span>
                  <span className="ml-2 shrink-0 text-[10px] uppercase text-neutral-500">
                    {target.kind}
                  </span>
                </button>
              ))}
            </div>
            {capturing && <p className="text-xs text-neutral-500">Capturing…</p>}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {step === "waiting-for-selection" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-neutral-300">
              Drag to select an area on screen. Press Esc there to cancel, or:
            </p>
            <Button variant="secondary" onClick={handleCancelSelection}>
              Cancel
            </Button>
          </div>
        )}

        {step === "crop" && (
          <>
            <p className="text-xs text-neutral-500">
              Drag to select a region, or save the full image as-is.
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
              <Button variant="secondary" className="text-xs" onClick={() => setStep("pick")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  disabled={captureEvidence.isPending}
                  onClick={handleUseFullImage}
                >
                  Use full image
                </Button>
                <Button
                  disabled={!selection || captureEvidence.isPending}
                  onClick={handleCropToSelection}
                >
                  {captureEvidence.isPending ? "Saving…" : "Crop to selection"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
