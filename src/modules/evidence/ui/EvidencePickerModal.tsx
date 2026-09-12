import { Modal } from "../../../shared/ui/Modal";
import type { CatalogEntry } from "../../workspace/workspace.types";
import type { Evidence } from "../evidence.types";
import { EvidenceGallery } from "./EvidenceGallery";

interface EvidencePickerModalProps {
  open: boolean;
  entry: CatalogEntry;
  onPick: (evidence: Evidence) => void;
  onClose: () => void;
}

export function EvidencePickerModal({ open, entry, onPick, onClose }: EvidencePickerModalProps) {
  return (
    <Modal open={open} title="Insert evidence" onClose={onClose}>
      <EvidenceGallery entry={entry} pickMode={{ onPick }} />
    </Modal>
  );
}
