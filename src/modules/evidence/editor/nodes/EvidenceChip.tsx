import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { FindingLinkPicker } from "../../../finding/ui/FindingLinkPicker";
import { readEvidenceBlob } from "../../evidence.service";
import { useEvidenceLookupStore } from "../../evidenceLookupStore";

export function EvidenceChip({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const id = node.attrs.id as string;
  const caption = (node.attrs.caption as string) ?? "";

  const activeEntry = useEvidenceLookupStore((state) => state.activeEntry);
  const entry = useEvidenceLookupStore((state) => state.evidenceById[id]);
  const [captionDraft, setCaptionDraft] = useState(caption);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  const missing = !entry;
  const deleted = entry?.isDeleted ?? false;
  const isImage = entry?.mimeType.startsWith("image/") ?? false;
  const label = entry?.originalName ?? id;

  useEffect(() => {
    if (!activeEntry || !entry || !isImage || missing || deleted) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    readEvidenceBlob(`${activeEntry.folderPath}/evidence`, entry)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setThumbUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeEntry, entry, isImage, missing, deleted]);

  const handleOpenGallery = () => {
    if (!activeEntry || missing || deleted) return;
    window.location.hash = `#/projects/${activeEntry.id}/evidence?preview=${id}`;
  };

  if (missing || deleted) {
    return (
      <NodeViewWrapper as="span" className="inline-block">
        <span
          className="rounded bg-neutral-800 px-1.5 py-0.5 text-sm text-neutral-500 line-through"
          title={missing ? "Evidence not found" : "Evidence deleted"}
        >
          📎 {label}
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="my-1 inline-block w-56 align-top">
      <span className="block rounded-md border border-neutral-700 bg-neutral-900/60 p-1.5">
        <button onClick={handleOpenGallery} className="block w-full">
          {isImage && thumbUrl ? (
            <img src={thumbUrl} alt="" className="h-24 w-full rounded object-cover" />
          ) : (
            <span className="flex h-16 w-full items-center justify-center rounded bg-neutral-800 text-2xl">
              📄
            </span>
          )}
        </button>
        <textarea
          value={captionDraft}
          onChange={(event) => setCaptionDraft(event.target.value)}
          onBlur={() => {
            if (captionDraft !== caption) updateAttributes({ caption: captionDraft });
          }}
          placeholder="Caption…"
          rows={2}
          className="mt-1 block w-full resize-none bg-transparent text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none"
        />
        <span className="mt-1 flex items-center justify-between">
          <button
            className="text-xs text-emerald-400 hover:text-emerald-300"
            onClick={() => setShowLinkPicker(true)}
          >
            Link to Finding →
          </button>
          <button
            className="text-xs text-neutral-500 hover:text-red-400"
            onClick={() => deleteNode()}
            title="Remove"
          >
            ✕
          </button>
        </span>
      </span>

      {activeEntry && (
        <FindingLinkPicker
          open={showLinkPicker}
          entry={activeEntry}
          evidenceId={id}
          onClose={() => setShowLinkPicker(false)}
        />
      )}
    </NodeViewWrapper>
  );
}
