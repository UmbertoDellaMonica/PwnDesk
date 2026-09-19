import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { errorMessage } from "../../../shared/lib/errorMessage";
import type { CatalogEntry } from "../../workspace/workspace.types";
import type { Evidence } from "../evidence.types";
import { useCaptureEvidence } from "../useEvidence";
import { useScreenshotList } from "../useScreenshots";
import { CaptureScreenshotModal } from "./CaptureScreenshotModal";
import { EvidenceGridItem } from "./EvidenceGridItem";
import { EvidencePreviewModal } from "./EvidencePreviewModal";

interface ScreenshotGalleryProps {
  entry: CatalogEntry;
}

export function ScreenshotGallery({ entry }: ScreenshotGalleryProps) {
  const { data: screenshots, isLoading } = useScreenshotList(entry);
  const captureEvidence = useCaptureEvidence(entry);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewItem, setPreviewItem] = useState<Evidence | null>(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // A screenshot taken externally (OS snipping tool) should still be pasteable
  // or dragged in here as a courtesy, and gets tagged the same as a native capture.
  const captureFiles = (files: FileList | File[]) => {
    setCaptureError(null);
    for (const file of Array.from(files)) {
      captureEvidence.mutate(
        { file, initialData: { category: "screenshot" } },
        { onError: (error) => setCaptureError(errorMessage(error)) },
      );
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = Array.from(event.clipboardData.items);
    const files = items
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (files.length > 0) captureFiles(files);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files.length > 0) captureFiles(event.dataTransfer.files);
  };

  return (
    <div
      tabIndex={0}
      onPaste={handlePaste}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`min-h-[200px] rounded-md border-2 border-dashed p-4 outline-none ${
        isDragOver ? "border-emerald-500 bg-emerald-950/20" : "border-neutral-800"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          Capture your screen, or paste/drag one taken externally.
        </p>
        <Button type="button" onClick={() => setShowCaptureModal(true)}>
          Capture screen…
        </Button>
      </div>

      {captureError && <p className="mb-2 text-xs text-red-400">Capture failed: {captureError}</p>}

      {isLoading && <p className="text-xs text-neutral-500">Loading…</p>}
      {!isLoading && screenshots?.length === 0 && (
        <p className="text-xs text-neutral-600">
          No screenshots yet — capture your screen or paste one here.
        </p>
      )}

      <div className="grid grid-cols-4 gap-2">
        {screenshots?.map((item) => (
          <EvidenceGridItem
            key={item.id}
            entry={entry}
            evidence={item}
            onClick={() => setPreviewItem(item)}
          />
        ))}
      </div>

      <EvidencePreviewModal entry={entry} evidence={previewItem} onClose={() => setPreviewItem(null)} />
      <CaptureScreenshotModal
        open={showCaptureModal}
        entry={entry}
        onClose={() => setShowCaptureModal(false)}
      />
    </div>
  );
}
