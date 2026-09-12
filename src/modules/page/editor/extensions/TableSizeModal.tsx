import { useState } from "react";
import { Button } from "../../../../shared/ui/Button";
import { Input } from "../../../../shared/ui/Input";
import { Modal } from "../../../../shared/ui/Modal";

interface TableSizeModalProps {
  open: boolean;
  onInsert: (rows: number, cols: number, withHeaderRow: boolean) => void;
  onClose: () => void;
}

const MAX_DIMENSION = 30;

function clampDimension(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_DIMENSION, Math.max(1, Math.round(value)));
}

export function TableSizeModal({ open, onInsert, onClose }: TableSizeModalProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);

  const handleInsert = () => {
    onInsert(clampDimension(rows), clampDimension(cols), withHeaderRow);
    onClose();
  };

  return (
    <Modal open={open} title="Insert table" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-neutral-400 mb-1">Rows</label>
            <Input
              type="number"
              min={1}
              max={MAX_DIMENSION}
              value={rows}
              onChange={(event) => setRows(Number(event.target.value))}
              autoFocus
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-neutral-400 mb-1">Columns</label>
            <Input
              type="number"
              min={1}
              max={MAX_DIMENSION}
              value={cols}
              onChange={(event) => setCols(Number(event.target.value))}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={withHeaderRow}
            onChange={(event) => setWithHeaderRow(event.target.checked)}
          />
          Header row
        </label>
        <p className="text-xs text-neutral-500">
          You can add/remove rows and columns later from the table toolbar, and drag column
          borders to resize.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert</Button>
        </div>
      </div>
    </Modal>
  );
}
