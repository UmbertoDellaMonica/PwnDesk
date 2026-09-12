import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pendingLabel?: string;
  danger?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A single, reusable confirm step for destructive actions — no destructive mutation in this app should be one click away with zero confirmation. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
  danger = true,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-300">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} disabled={isPending} onClick={onConfirm}>
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
