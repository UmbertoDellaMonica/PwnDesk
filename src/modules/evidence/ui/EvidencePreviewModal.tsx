import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { Modal } from "../../../shared/ui/Modal";
import { showToast } from "../../../shared/ui/toastStore";
import { useFindingsForEvidence } from "../../finding/useFindings";
import { FindingLinkPicker } from "../../finding/ui/FindingLinkPicker";
import { findPagesReferencingTarget } from "../../page/page.utils";
import { usePages } from "../../page/usePages";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { readEvidenceBlob } from "../evidence.service";
import type { Evidence } from "../evidence.types";
import { useDeleteEvidence, useDerivedEvidence, useEvidenceById } from "../useEvidence";
import { EvidenceClassificationPanel } from "./EvidenceClassificationPanel";
import { RedactEvidenceModal } from "./RedactEvidenceModal";

interface EvidencePreviewModalProps {
  entry: CatalogEntry;
  evidence: Evidence | null;
  onClose: () => void;
}

export function EvidencePreviewModal({ entry, evidence, onClose }: EvidencePreviewModalProps) {
  const isImage = evidence?.mimeType.startsWith("image/") ?? false;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const deleteEvidence = useDeleteEvidence(entry);
  const { data: referencingFindings } = useFindingsForEvidence(entry, evidence?.id);
  const { data: pages } = usePages(entry);
  const { data: derivedCopies } = useDerivedEvidence(entry, evidence?.id);
  const { data: derivedFrom } = useEvidenceById(entry, evidence?.derivedFromId ?? undefined);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [showRedactModal, setShowRedactModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const referencingPages = evidence
    ? findPagesReferencingTarget(pages ?? [], "evidence", evidence.id)
    : [];

  useEffect(() => {
    if (!evidence || !isImage) {
      setPreviewUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;

    readEvidenceBlob(`${entry.folderPath}/evidence`, evidence)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        // Evidence file may have raced a project/evidence deletion — nothing to show.
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry.folderPath, evidence, isImage]);

  const handleDelete = async () => {
    if (!evidence) return;
    await deleteEvidence.mutateAsync(evidence.id);
    showToast(`Deleted evidence "${evidence.originalName ?? evidence.sha256.slice(0, 12)}"`);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <Modal open={evidence !== null} title={evidence?.originalName ?? "Evidence"} onClose={onClose}>
      {evidence && (
        <div className="space-y-3">
          {isImage && previewUrl && (
            <img src={previewUrl} alt={evidence.originalName ?? ""} className="max-h-80 w-full rounded object-contain" />
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-neutral-400">
            <dt>SHA-256</dt>
            <dd className="truncate font-mono">{evidence.sha256}</dd>
            <dt>Type</dt>
            <dd>{evidence.mimeType}</dd>
            <dt>Size</dt>
            <dd>{(evidence.byteSize / 1024).toFixed(1)} KB</dd>
            <dt>Captured</dt>
            <dd>{new Date(evidence.capturedAt).toLocaleString()}</dd>
            {derivedFrom && (
              <>
                <dt>Derived from</dt>
                <dd className="truncate">{derivedFrom.originalName ?? derivedFrom.sha256.slice(0, 12)}</dd>
              </>
            )}
          </dl>

          {(derivedCopies?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-400">Redacted / derived copies</p>
              <ul className="space-y-0.5">
                {derivedCopies?.map((copy) => (
                  <li key={copy.id} className="text-xs text-neutral-400">
                    {copy.originalName ?? copy.sha256.slice(0, 12)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(referencingFindings?.length ?? 0) > 0 || referencingPages.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-medium text-neutral-400">Referenced in</p>
              <ul className="space-y-0.5">
                {referencingFindings?.map((finding) => (
                  <li key={`finding-${finding.id}`}>
                    <Link
                      to={`/projects/${entry.id}/findings/${finding.id}`}
                      onClick={onClose}
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      Finding: {finding.title}
                    </Link>
                  </li>
                ))}
                {referencingPages.map((page) => (
                  <li key={`page-${page.id}`}>
                    <Link
                      to={`/projects/${entry.id}/pages/${page.id}`}
                      onClick={onClose}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Page: {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-neutral-600">Not referenced by any page or finding yet.</p>
          )}

          <EvidenceClassificationPanel entry={entry} evidence={evidence} />

          <div className="flex justify-end gap-2 pt-2">
            {isImage && (
              <Button variant="secondary" onClick={() => setShowRedactModal(true)}>
                Redact…
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowLinkPicker(true)}>
              Link to Finding →
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button variant="danger" disabled={deleteEvidence.isPending} onClick={() => setShowDeleteConfirm(true)}>
              {deleteEvidence.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>

          <FindingLinkPicker
            open={showLinkPicker}
            entry={entry}
            evidenceId={evidence.id}
            onClose={() => setShowLinkPicker(false)}
          />
          {isImage && (
            <RedactEvidenceModal
              open={showRedactModal}
              entry={entry}
              evidence={evidence}
              onClose={() => setShowRedactModal(false)}
              onSaved={() => {
                setShowRedactModal(false);
                showToast("Saved redacted copy");
              }}
            />
          )}
          <ConfirmDialog
            open={showDeleteConfirm}
            title="Delete evidence"
            message={`This removes "${evidence.originalName ?? evidence.sha256.slice(0, 12)}" from the gallery and every finding/page that links it. The file is kept on disk (immutable evidence rule) but won't be reachable from the app anymore.`}
            isPending={deleteEvidence.isPending}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </div>
      )}
    </Modal>
  );
}
