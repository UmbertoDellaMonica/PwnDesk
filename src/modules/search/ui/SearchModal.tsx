import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvidenceList } from "../../evidence/useEvidence";
import { useAssets, useFindings } from "../../finding/useFindings";
import { usePages } from "../../page/usePages";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { Input } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { searchProject, type SearchResult } from "../search";

interface SearchModalProps {
  open: boolean;
  entry: CatalogEntry;
  onClose: () => void;
}

const ROUTE_BY_KIND = {
  page: (entryId: string, id: string) => `/projects/${entryId}/pages/${id}`,
  finding: (entryId: string, id: string) => `/projects/${entryId}/findings/${id}`,
  evidence: (entryId: string, id: string) => `/projects/${entryId}/evidence?preview=${id}`,
  asset: (entryId: string, id: string) => `/projects/${entryId}/assets/${id}`,
} as const;

const KIND_FILTERS: { id: SearchResult["kind"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "page", label: "Pages" },
  { id: "finding", label: "Findings" },
  { id: "evidence", label: "Evidence" },
  { id: "asset", label: "Assets" },
];

export function SearchModal({ open, entry, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<SearchResult["kind"] | "all">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data: pages } = usePages(entry);
  const { data: findings } = useFindings(entry);
  const { data: evidenceList } = useEvidenceList(entry);
  const { data: assets } = useAssets(entry);
  const navigate = useNavigate();

  const allResults = useMemo(
    () => searchProject(pages ?? [], findings ?? [], query, evidenceList ?? [], assets ?? []),
    [pages, findings, evidenceList, assets, query],
  );
  const results =
    kindFilter === "all" ? allResults : allResults.filter((result) => result.kind === kindFilter);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, kindFilter, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setKindFilter("all");
    }
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    navigate(ROUTE_BY_KIND[result.kind](entry.id, result.id));
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const result = results[selectedIndex];
      if (result) handleSelect(result);
    }
  };

  return (
    <Modal open={open} title="Search this project" onClose={onClose} size="lg">
      <div className="space-y-3" onKeyDown={handleKeyDown}>
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages, findings, evidence, assets…"
        />

        <div className="flex flex-wrap gap-1.5">
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setKindFilter(filter.id)}
              className={`rounded-full px-2.5 py-0.5 text-xs ${
                kindFilter === filter.id
                  ? "bg-emerald-800/60 text-emerald-200"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {filter.label}
              {filter.id !== "all" &&
                ` (${allResults.filter((result) => result.kind === filter.id).length})`}
            </button>
          ))}
        </div>

        <p className="text-xs text-neutral-600">
          ↑↓ to navigate, Enter to open. Searches page text (including inline vulnerability
          notes), finding titles/descriptions, evidence file names, and asset names.
        </p>

        {query.trim() && results.length === 0 && (
          <p className="text-xs text-neutral-500">No matches.</p>
        )}

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.kind}-${result.id}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`block w-full rounded-md px-3 py-2 text-left ${
                index === selectedIndex ? "bg-neutral-800" : "bg-neutral-800/60 hover:bg-neutral-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-700 px-1.5 py-0.5 text-[10px] uppercase text-neutral-400">
                  {result.kind}
                </span>
                <span className="truncate text-sm text-neutral-200">{result.title}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-neutral-500">{result.snippet}</p>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
