import { useEffect, useState } from "react";
import { EvidencePickerModal } from "../../evidence/ui/EvidencePickerModal";
import { EvidencePreviewModal } from "../../evidence/ui/EvidencePreviewModal";
import { readEvidenceBlob } from "../../evidence/evidence.service";
import { useEvidenceList } from "../../evidence/useEvidence";
import type { Evidence } from "../../evidence/evidence.types";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { Button } from "../../../shared/ui/Button";
import { Textarea } from "../../../shared/ui/Textarea";
import {
  useFinding,
  useFindingEvidenceIds,
  useLinkFindingEvidence,
  useUnlinkFindingEvidence,
  useUpdateFindingEvidenceCaption,
} from "../useFindings";

interface FindingEvidencePanelProps {
  entry: CatalogEntry;
  findingId: string;
}

function FindingFigure({
  entry,
  evidence,
  figureNumber,
  caption,
  onCaptionChange,
  onPreview,
  onUnlink,
}: {
  entry: CatalogEntry;
  evidence: Evidence;
  figureNumber: number;
  caption: string;
  onCaptionChange: (value: string) => void;
  onPreview: () => void;
  onUnlink: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = evidence.mimeType.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    readEvidenceBlob(`${entry.folderPath}/evidence`, evidence).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry.folderPath, evidence, isImage]);

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900/40 p-2">
      <button onClick={onPreview} className="block w-full">
        {isImage && url ? (
          <img src={url} alt="" className="max-h-64 w-full rounded object-contain" />
        ) : (
          <div className="flex h-32 items-center justify-center rounded bg-neutral-800 text-3xl">
            📄
          </div>
        )}
      </button>
      <div className="mt-1.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400">Figure {figureNumber}</span>
          <button className="text-xs text-neutral-500 hover:text-red-400" onClick={onUnlink}>
            Unlink
          </button>
        </div>
        <Textarea
          defaultValue={caption}
          onBlur={(event) => onCaptionChange(event.target.value)}
          placeholder="Describe what this shows — what a reader should notice, not just what's pictured…"
          rows={3}
          className="text-xs"
        />
      </div>
    </div>
  );
}

export function FindingEvidencePanel({ entry, findingId }: FindingEvidencePanelProps) {
  const { data: finding } = useFinding(entry, findingId);
  const { data: linkedIds } = useFindingEvidenceIds(entry, findingId);
  const { data: allEvidence } = useEvidenceList(entry);
  const linkEvidence = useLinkFindingEvidence(entry, findingId);
  const unlinkEvidence = useUnlinkFindingEvidence(entry, findingId);
  const updateCaption = useUpdateFindingEvidenceCaption(entry, findingId);

  const [showPicker, setShowPicker] = useState(false);
  const [previewItem, setPreviewItem] = useState<Evidence | null>(null);

  const linkedIdSet = new Set(linkedIds ?? []);
  const linkedEvidence = (allEvidence ?? []).filter((item) => linkedIdSet.has(item.id));
  const captions = finding?.data.evidenceCaptions ?? {};

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-300">Evidence</h2>
        <Button variant="secondary" className="text-xs" onClick={() => setShowPicker(true)}>
          + Link evidence
        </Button>
      </div>

      {linkedEvidence.length === 0 && (
        <p className="text-xs text-neutral-500">
          No evidence linked yet — attach a screenshot and caption it, this is what makes the
          finding easy to hand off later.
        </p>
      )}

      <div className="space-y-2">
        {linkedEvidence.map((item, index) => (
          <FindingFigure
            key={item.id}
            entry={entry}
            evidence={item}
            figureNumber={index + 1}
            caption={captions[item.id] ?? ""}
            onCaptionChange={(caption) =>
              finding &&
              updateCaption.mutate({ evidenceId: item.id, caption, currentData: finding.data })
            }
            onPreview={() => setPreviewItem(item)}
            onUnlink={() => unlinkEvidence.mutate(item.id)}
          />
        ))}
      </div>

      <EvidencePickerModal
        open={showPicker}
        entry={entry}
        onPick={(evidence) => {
          linkEvidence.mutate(evidence.id);
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />
      <EvidencePreviewModal entry={entry} evidence={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
