import { Link } from "react-router-dom";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { useBacklinks } from "../usePages";

interface BacklinksPanelProps {
  entry: CatalogEntry;
  pageId: string;
}

export function BacklinksPanel({ entry, pageId }: BacklinksPanelProps) {
  const { data: backlinks, isLoading } = useBacklinks(entry, pageId);

  return (
    <div className="mt-8 border-t border-neutral-800 pt-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">
        Linked from
      </h2>
      {isLoading && <p className="text-xs text-neutral-500">Loading…</p>}
      {!isLoading && backlinks?.length === 0 && (
        <p className="text-xs text-neutral-600">No pages link here yet.</p>
      )}
      <ul className="space-y-1">
        {backlinks?.map((backlink) => (
          <li key={backlink.pageId}>
            <Link
              to={`/projects/${entry.id}/pages/${backlink.pageId}`}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              {backlink.pageTitle}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
