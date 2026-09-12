import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { errorMessage } from "../../../shared/lib/errorMessage";
import type { CatalogEntry } from "../../workspace/workspace.types";
import type { Evidence } from "../evidence.types";
import { useCaptureEvidence, useEvidenceList } from "../useEvidence";
import { EvidenceGridItem } from "./EvidenceGridItem";
import { EvidencePreviewModal } from "./EvidencePreviewModal";

interface EvidenceGalleryProps {
  entry: CatalogEntry;
  pickMode?: { onPick: (evidence: Evidence) => void };
  initialPreviewId?: string;
}

export function EvidenceGallery({ entry, pickMode, initialPreviewId }: EvidenceGalleryProps) {
  const { data: evidenceList, isLoading } = useEvidenceList(entry);
  const captureEvidence = useCaptureEvidence(entry);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewItem, setPreviewItem] = useState<Evidence | null>(null);
  // Tracked independently of captureEvidence.isPending: that single mutation
  // object only reflects the most recently dispatched call, which undercounts
  // when several files are pasted/dropped at once.
  const [pendingUploads, setPendingUploads] = useState(0);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPreviewId && evidenceList) {
      setPreviewItem(evidenceList.find((item) => item.id === initialPreviewId) ?? null);
    }
    // Only react to the list finishing its first load / the deep-link id changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPreviewId, evidenceList !== undefined]);

  const captureFiles = (files: FileList | File[]) => {
    console.log("[evidence] captureFiles called with", files.length, "file(s)");
    setCaptureError(null);
    for (const file of Array.from(files)) {
      console.log("[evidence] dispatching capture for", file.name, file.type, file.size);
      setPendingUploads((count) => count + 1);
      captureEvidence.mutate(file, {
        onSettled: () => setPendingUploads((count) => count - 1),
        onSuccess: () => console.log("[evidence] capture succeeded for", file.name),
        onError: (error) => {
          console.error("[evidence] capture failed for", file.name, error);
          setCaptureError(errorMessage(error));
        },
      });
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    console.log("[evidence] paste event fired");
    const items = Array.from(event.clipboardData.items);
    const files = items
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (files.length > 0) captureFiles(files);
  };

  const handleDrop = (event: React.DragEvent) => {
    console.log("[evidence] drop event fired,", event.dataTransfer.files.length, "file(s)");
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files.length > 0) captureFiles(event.dataTransfer.files);
  };

  const handleItemClick = (item: Evidence) => {
    if (pickMode) {
      pickMode.onPick(item);
    } else {
      setPreviewItem(item);
    }
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
          {pendingUploads > 0
            ? `Uploading ${pendingUploads} file${pendingUploads > 1 ? "s" : ""}…`
            : "Paste, drag & drop, or browse to add evidence."}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          disabled={pendingUploads > 0}
          onClick={() => {
            console.log("[evidence] Browse clicked, input ref:", fileInputRef.current);
            fileInputRef.current?.click();
          }}
        >
          {pendingUploads > 0 ? "Uploading…" : "Browse"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            console.log("[evidence] input onChange fired,", event.target.files?.length ?? 0, "file(s)");
            if (event.target.files) captureFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {captureError && (
        <p className="mb-2 text-xs text-red-400">Upload failed: {captureError}</p>
      )}

      {isLoading && <p className="text-xs text-neutral-500">Loading…</p>}
      {!isLoading && evidenceList?.length === 0 && (
        <p className="text-xs text-neutral-600">No evidence yet.</p>
      )}

      <div className="grid grid-cols-4 gap-2">
        {evidenceList?.map((item) => (
          <EvidenceGridItem
            key={item.id}
            entry={entry}
            evidence={item}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>

      {!pickMode && (
        <EvidencePreviewModal entry={entry} evidence={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}
