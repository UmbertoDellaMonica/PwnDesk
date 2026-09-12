import { useMemo, useState } from "react";
import { Input } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { METHODOLOGIES } from "../../project/methodology";
import { listKnownCwes } from "../../methodology/testCatalog";

interface CweCategoryPickerProps {
  open: boolean;
  onSelect: (category: string) => void;
  onClose: () => void;
}

export function CweCategoryPicker({ open, onSelect, onClose }: CweCategoryPickerProps) {
  const [query, setQuery] = useState("");
  const cwes = useMemo(() => listKnownCwes(), []);

  const trimmed = query.trim().toLowerCase();
  // Search across code, name, and description — a search for "MITM" or
  // "buffer" now finds the relevant CWE even if the query never matches its
  // official title.
  const filtered = trimmed
    ? cwes.filter(
        (item) =>
          item.cwe.toLowerCase().includes(trimmed) ||
          item.name.toLowerCase().includes(trimmed) ||
          item.description.toLowerCase().includes(trimmed),
      )
    : cwes;

  return (
    <Modal open={open} title="Select CWE category" onClose={onClose} size="lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by CWE code, name, or description…"
          />
          {query.trim() && (
            <button
              className="whitespace-nowrap rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800"
              onClick={() => {
                onSelect(query.trim());
                setQuery("");
              }}
            >
              Use "{query.trim()}"
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-600">
          {filtered.length} of {cwes.length} known CWEs
        </p>
        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {filtered.map((item) => (
            <button
              key={item.cwe}
              onClick={() => {
                onSelect(item.cwe);
                setQuery("");
              }}
              className="block w-full rounded-md bg-neutral-800/60 px-3 py-2 text-left hover:bg-neutral-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-200">{item.cwe}</span>
                <span className="text-xs text-neutral-400">{item.name}</span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                {item.methodologyIds.map((id) => METHODOLOGIES[id].label).join(" · ")}
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-neutral-500">
              No matches. Use the free-text button above to enter a custom category.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
