import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readEvidenceBlob } from "../../../evidence/evidence.service";
import { useEvidenceLookupStore } from "../../../evidence/evidenceLookupStore";
import { EvidencePickerModal } from "../../../evidence/ui/EvidencePickerModal";
import { Button } from "../../../../shared/ui/Button";
import { SeverityBadge } from "../../../../shared/ui/Badge";
import type { MethodologyId } from "../../../project/methodology";
import { useProjectDetails } from "../../../project/useProjects";
import { useFindingLookupStore } from "../../findingLookupStore";
import type { FindingSeverity } from "../../finding.types";
import { PromoteToFindingModal } from "../../ui/PromoteToFindingModal";
import { VulnerabilityPicker } from "./VulnerabilityPicker";
import type { FlatVulnerability } from "../../../methodology/testCatalog";

interface VulnNoteAttrs {
  title: string;
  cwe: string | null;
  cvssVector: string | null;
  cvssScore: number | null;
  severity: FindingSeverity | null;
  description: string;
  reproduction: string;
  evidenceIds: string[];
  evidenceCaptions: Record<string, string>;
  promotedFindingId: string | null;
}

function EvidenceThumb({
  entry,
  evidenceId,
  mimeType,
  sha256,
}: {
  entry: { folderPath: string };
  evidenceId: string;
  mimeType: string | undefined;
  sha256: string | undefined;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = mimeType?.startsWith("image/") ?? false;

  useEffect(() => {
    if (!isImage || !sha256 || !mimeType) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    readEvidenceBlob(`${entry.folderPath}/evidence`, { sha256, mimeType })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry.folderPath, evidenceId, isImage, mimeType, sha256]);

  if (!isImage) return <span className="text-lg">📄</span>;
  return url ? (
    <img src={url} alt="" className="h-16 w-full rounded object-cover" />
  ) : (
    <div className="h-16 w-full rounded bg-neutral-800" />
  );
}

// Isolated local draft state, committed only on blur — a fully-controlled
// input tied directly to node.attrs re-renders the atom NodeView on every
// keystroke and drops focus after each character.
function CaptionInput({
  initialValue,
  onCommit,
}: {
  initialValue: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(initialValue);
  return (
    <textarea
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== initialValue) onCommit(draft);
      }}
      placeholder="Caption…"
      rows={2}
      className="mt-1 w-full resize-none bg-transparent text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none"
    />
  );
}

function DraftTextarea({
  initialValue,
  placeholder,
  onCommit,
}: {
  initialValue: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(initialValue);
  return (
    <textarea
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== initialValue) onCommit(draft);
      }}
      placeholder={placeholder}
      rows={3}
      className="mb-2 w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
    />
  );
}

export function VulnNoteBlock({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as VulnNoteAttrs;

  const activeEntry = useEvidenceLookupStore((state) => state.activeEntry);
  const evidenceById = useEvidenceLookupStore((state) => state.evidenceById);
  const navigate = useNavigate();
  const { data: project } = useProjectDetails(activeEntry);
  const methodologyId = (project?.data.methodologyId as MethodologyId | undefined) ?? "none";

  const [showPicker, setShowPicker] = useState(false);
  const [showVulnPicker, setShowVulnPicker] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  // Findings are hard-deleted (no soft-delete flag), so a promoted note whose
  // Finding was later deleted must be detected here rather than trusting
  // promotedFindingId forever — otherwise this block keeps rendering a stale
  // "promoted" summary with a link to a page that says "not found".
  const promotedFinding = useFindingLookupStore((state) =>
    attrs.promotedFindingId ? state.findingsById[attrs.promotedFindingId] : undefined,
  );

  const handleSelectVulnerability = (vuln: FlatVulnerability) => {
    updateAttributes({ title: vuln.name, cwe: vuln.cwe ?? null, description: vuln.description });
    setShowVulnPicker(false);
  };

  if (attrs.promotedFindingId) {
    const findingDeleted = !promotedFinding;
    return (
      <NodeViewWrapper className="my-2">
        <div
          className={`rounded-md border p-3 ${
            findingDeleted
              ? "border-red-800/50 bg-red-950/10"
              : "border-emerald-800/50 bg-emerald-950/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <span title={findingDeleted ? "Promoted Finding was deleted" : "Promoted to Finding"}>
              {findingDeleted ? "⚠️" : "✅"}
            </span>
            <span className="flex-1 text-sm font-semibold text-neutral-200">
              {promotedFinding?.title ?? attrs.title}
            </span>
            {attrs.severity && <SeverityBadge severity={attrs.severity} />}
          </div>
          <p className="mt-1 text-xs text-neutral-500">{attrs.description}</p>
          {findingDeleted ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-red-400">
                The promoted Finding was deleted — this note is no longer linked to it.
              </span>
              <button
                className="text-xs text-emerald-400 hover:text-emerald-300"
                onClick={() => updateAttributes({ promotedFindingId: null })}
              >
                Unlink & re-edit
              </button>
            </div>
          ) : (
            activeEntry && (
              <button
                className="mt-2 text-xs text-emerald-400 hover:text-emerald-300"
                onClick={() => navigate(`/projects/${activeEntry.id}/findings/${attrs.promotedFindingId}`)}
              >
                View Finding →
              </button>
            )
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-2">
      <div className="rounded-md border border-amber-800/50 bg-amber-950/20 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span title="Vulnerability note">🐞</span>
          <input
            value={attrs.title}
            onChange={(event) => updateAttributes({ title: event.target.value })}
            placeholder="Suspected vulnerability…"
            className="flex-1 bg-transparent text-sm font-semibold text-neutral-100 focus:outline-none"
          />
          <Button variant="ghost" className="text-xs" onClick={() => setShowVulnPicker(true)}>
            Select type…
          </Button>
          <button
            className="text-xs text-neutral-500 hover:text-red-400"
            onClick={() => deleteNode()}
            title="Remove"
          >
            ✕
          </button>
        </div>

        <div className="mb-2 flex items-center gap-2">
          {attrs.cwe && (
            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
              {attrs.cwe}
            </span>
          )}
          {attrs.severity ? (
            <>
              <SeverityBadge severity={attrs.severity} />
              <span className="text-xs font-semibold text-neutral-200">
                {attrs.cvssScore?.toFixed(1)}
              </span>
              <span className="font-mono text-xs text-neutral-500">{attrs.cvssVector}</span>
            </>
          ) : (
            <span className="text-xs text-neutral-500">Not assessed</span>
          )}
        </div>

        <DraftTextarea
          initialValue={attrs.description}
          placeholder="What did you see?"
          onCommit={(description) => updateAttributes({ description })}
        />
        <DraftTextarea
          initialValue={attrs.reproduction}
          placeholder="How did you find it? (steps, flow)"
          onCommit={(reproduction) => updateAttributes({ reproduction })}
        />

        <div className="grid grid-cols-3 gap-2">
          {attrs.evidenceIds.map((id) => {
            const evidence = evidenceById[id];
            const missing = !evidence || evidence.isDeleted;
            return (
              <div key={id} className="rounded-md border border-neutral-700 bg-neutral-900/40 p-1.5">
                {missing ? (
                  <div className="flex h-16 items-center justify-center text-xs text-neutral-500 line-through">
                    {evidence?.originalName ?? id}
                  </div>
                ) : (
                  activeEntry && (
                    <EvidenceThumb
                      entry={activeEntry}
                      evidenceId={id}
                      mimeType={evidence?.mimeType}
                      sha256={evidence?.sha256}
                    />
                  )
                )}
                <CaptionInput
                  initialValue={attrs.evidenceCaptions[id] ?? ""}
                  onCommit={(caption) =>
                    updateAttributes({
                      evidenceCaptions: { ...attrs.evidenceCaptions, [id]: caption },
                    })
                  }
                />
                <button
                  className="text-xs text-neutral-500 hover:text-red-400"
                  onClick={() =>
                    updateAttributes({
                      evidenceIds: attrs.evidenceIds.filter((existing) => existing !== id),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          {activeEntry && (
            <Button variant="ghost" className="text-xs" onClick={() => setShowPicker(true)}>
              + Evidence
            </Button>
          )}
          <Button variant="secondary" className="ml-auto text-xs" onClick={() => setShowPromoteModal(true)}>
            Promote to Finding →
          </Button>
        </div>
      </div>

      <VulnerabilityPicker
        open={showVulnPicker}
        methodologyId={methodologyId}
        onSelect={handleSelectVulnerability}
        onClose={() => setShowVulnPicker(false)}
      />

      {activeEntry && (
        <>
          <EvidencePickerModal
            open={showPicker}
            entry={activeEntry}
            onPick={(evidence) => {
              if (!attrs.evidenceIds.includes(evidence.id)) {
                updateAttributes({ evidenceIds: [...attrs.evidenceIds, evidence.id] });
              }
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
          <PromoteToFindingModal
            open={showPromoteModal}
            entry={activeEntry}
            note={{
              title: attrs.title,
              description: attrs.description,
              reproduction: attrs.reproduction,
              cwe: attrs.cwe,
              cvssVector: attrs.cvssVector,
              cvssScore: attrs.cvssScore,
              severity: attrs.severity,
              evidenceIds: attrs.evidenceIds,
              evidenceCaptions: attrs.evidenceCaptions,
            }}
            onClose={() => setShowPromoteModal(false)}
            onPromoted={(findingId) => {
              updateAttributes({ promotedFindingId: findingId });
              setShowPromoteModal(false);
              navigate(`/projects/${activeEntry.id}/findings/${findingId}`);
            }}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}
