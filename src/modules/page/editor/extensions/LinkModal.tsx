import { useEffect, useState } from "react";
import { Button } from "../../../../shared/ui/Button";
import { Input } from "../../../../shared/ui/Input";
import { Modal } from "../../../../shared/ui/Modal";

interface LinkModalProps {
  open: boolean;
  initialUrl: string;
  onApply: (url: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function LinkModal({ open, initialUrl, onApply, onRemove, onClose }: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (open) setUrl(initialUrl);
  }, [open, initialUrl]);

  const handleApply = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onApply(trimmed);
    onClose();
  };

  return (
    <Modal open={open} title={initialUrl ? "Edit link" : "Insert link"} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">URL</label>
          <Input
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleApply();
              }
            }}
            placeholder="https://cve.mitre.org/…"
          />
        </div>
        <p className="text-xs text-neutral-500">
          Ctrl/Cmd+Click a link in the page to open it in your browser.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          {initialUrl && (
            <Button
              variant="ghost"
              className="text-red-400"
              onClick={() => {
                onRemove();
                onClose();
              }}
            >
              Remove link
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!url.trim()}>
            {initialUrl ? "Update" : "Insert"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
