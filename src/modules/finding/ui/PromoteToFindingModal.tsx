import { useEffect, useState } from "react";
import { Cvss31CalculatorModal } from "../../cvss/Cvss31CalculatorModal";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { SeverityBadge } from "../../../shared/ui/Badge";
import type { CatalogEntry } from "../../workspace/workspace.types";
import type { FindingSeverity } from "../finding.types";
import { usePromoteVulnNote } from "../useFindings";
import { CweCategoryPicker } from "./CweCategoryPicker";

interface PromoteToFindingModalProps {
  open: boolean;
  entry: CatalogEntry;
  note: {
    title: string;
    description: string;
    reproduction: string;
    cwe: string | null;
    cvssVector: string | null;
    cvssScore: number | null;
    severity: FindingSeverity | null;
    evidenceIds: string[];
    evidenceCaptions: Record<string, string>;
  };
  onClose: () => void;
  onPromoted: (findingId: string) => void;
}

export function PromoteToFindingModal({
  open,
  entry,
  note,
  onClose,
  onPromoted,
}: PromoteToFindingModalProps) {
  const promoteVulnNote = usePromoteVulnNote(entry);

  const [title, setTitle] = useState(note.title);
  const [category, setCategory] = useState(note.cwe ?? "");
  const [cvssVector, setCvssVector] = useState(note.cvssVector);
  const [cvssScore, setCvssScore] = useState(note.cvssScore);
  const [severity, setSeverity] = useState(note.severity);
  const [showCwePicker, setShowCwePicker] = useState(false);
  const [showCvssModal, setShowCvssModal] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(note.title);
    setCategory(note.cwe ?? "");
    setCvssVector(note.cvssVector);
    setCvssScore(note.cvssScore);
    setSeverity(note.severity);
    // Reset the confirmation form from the note's current state each time it's reopened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = async () => {
    const finding = await promoteVulnNote.mutateAsync({
      title,
      description: note.description,
      reproduction: note.reproduction,
      category,
      cvssVector,
      cvssScore,
      severity,
      evidenceIds: note.evidenceIds,
      evidenceCaptions: note.evidenceCaptions,
    });
    onPromoted(finding.id);
  };

  return (
    <>
      <Modal open={open} title="Promote to Finding" onClose={onClose} size="lg">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Title</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-400">CWE category</label>
            <div className="flex items-center gap-2">
              <span className="flex-1 rounded-md border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-sm text-neutral-200">
                {category || <span className="text-neutral-500">Not set</span>}
              </span>
              <Button variant="secondary" className="text-xs" onClick={() => setShowCwePicker(true)}>
                Select…
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-400">Severity</label>
            <div className="flex items-center gap-2">
              {severity ? (
                <>
                  <SeverityBadge severity={severity} />
                  <span className="text-sm font-semibold text-neutral-200">
                    {cvssScore?.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">{cvssVector}</span>
                </>
              ) : (
                <span className="text-xs text-neutral-500">Not assessed</span>
              )}
              <Button variant="secondary" className="text-xs" onClick={() => setShowCvssModal(true)}>
                Assess (CVSS 3.1)…
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={promoteVulnNote.isPending || !title.trim()}
              onClick={handleConfirm}
            >
              {promoteVulnNote.isPending ? "Creating…" : "Create Finding"}
            </Button>
          </div>
        </div>
      </Modal>

      <CweCategoryPicker
        open={showCwePicker}
        onSelect={(value) => {
          setCategory(value);
          setShowCwePicker(false);
        }}
        onClose={() => setShowCwePicker(false)}
      />

      <Cvss31CalculatorModal
        open={showCvssModal}
        initialVector={cvssVector}
        onSave={(result) => {
          setCvssVector(result.vector);
          setCvssScore(result.score);
          setSeverity(result.severity);
          setShowCvssModal(false);
        }}
        onClose={() => setShowCvssModal(false)}
      />
    </>
  );
}
