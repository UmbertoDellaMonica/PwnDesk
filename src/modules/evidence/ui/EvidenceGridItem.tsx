import { useEffect, useState } from "react";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { readEvidenceBlob } from "../evidence.service";
import type { Evidence } from "../evidence.types";

interface EvidenceGridItemProps {
  entry: CatalogEntry;
  evidence: Evidence;
  onClick: () => void;
}

export function EvidenceGridItem({ entry, evidence, onClick }: EvidenceGridItemProps) {
  const isImage = evidence.mimeType.startsWith("image/");
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    readEvidenceBlob(`${entry.folderPath}/evidence`, evidence)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setThumbUrl(objectUrl);
      })
      .catch(() => {
        // Evidence file may have raced a project/evidence deletion — nothing to show.
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry.folderPath, evidence, isImage]);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-md border border-neutral-800 bg-neutral-900/40 p-2 hover:border-neutral-600"
    >
      <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded bg-neutral-800">
        {isImage && thumbUrl ? (
          <img src={thumbUrl} alt={evidence.originalName ?? ""} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl">📄</span>
        )}
      </div>
      <span className="w-full truncate text-xs text-neutral-400" title={evidence.originalName ?? ""}>
        {evidence.originalName ?? evidence.sha256.slice(0, 10)}
      </span>
    </button>
  );
}
