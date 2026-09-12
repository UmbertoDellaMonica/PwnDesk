import { useState } from "react";
import { Input } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { SeverityBadge } from "../../../shared/ui/Badge";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { useFindings, useLinkEvidenceToAnyFinding } from "../useFindings";

interface FindingLinkPickerProps {
  open: boolean;
  entry: CatalogEntry;
  evidenceId: string;
  onClose: () => void;
}

export function FindingLinkPicker({ open, entry, evidenceId, onClose }: FindingLinkPickerProps) {
  const [query, setQuery] = useState("");
  const { data: findings } = useFindings(entry);
  const linkToFinding = useLinkEvidenceToAnyFinding(entry);

  const filtered = (findings ?? []).filter((finding) =>
    finding.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Modal open={open} title="Link this evidence to a Finding" onClose={onClose}>
      <div className="space-y-3">
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search findings…"
        />
        {findings?.length === 0 && (
          <p className="text-xs text-neutral-500">
            No findings yet — create one from the Findings section, or promote a Vulnerability
            note.
          </p>
        )}
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.map((finding) => (
            <button
              key={finding.id}
              disabled={linkToFinding.isPending}
              onClick={async () => {
                await linkToFinding.mutateAsync({ findingId: finding.id, evidenceId });
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-md bg-neutral-800/60 px-3 py-2 text-left hover:bg-neutral-800"
            >
              {finding.displayId && (
                <span className="font-mono text-xs text-neutral-500">{finding.displayId}</span>
              )}
              <span className="flex-1 truncate text-sm text-neutral-200">{finding.title}</span>
              <SeverityBadge severity={finding.severity} />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
