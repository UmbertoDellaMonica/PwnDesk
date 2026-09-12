import { Modal } from "../../shared/ui/Modal";
import { Cvss31Calculator } from "./Cvss31Calculator";
import type { computeCvss31 } from "./cvss31";

interface Cvss31CalculatorModalProps {
  open: boolean;
  initialVector?: string | null;
  onSave: (result: ReturnType<typeof computeCvss31>) => void;
  onClose: () => void;
}

export function Cvss31CalculatorModal({
  open,
  initialVector,
  onSave,
  onClose,
}: Cvss31CalculatorModalProps) {
  return (
    <Modal open={open} title="Assess severity (CVSS 3.1)" onClose={onClose}>
      <Cvss31Calculator
        initialVector={initialVector}
        onSave={(result) => {
          onSave(result);
          onClose();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
}
