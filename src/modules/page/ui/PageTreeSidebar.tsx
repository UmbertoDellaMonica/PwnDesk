import { useEffect, useState } from "react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { useProjects } from "../../project/useProjects";
import { SearchModal } from "../../search/ui/SearchModal";
import { useCreatePage, useDeletePage, useMovePage, usePages } from "../usePages";
import { PageTree } from "./PageTree";

export function PageTreeSidebar() {
  const match = useMatch("/projects/:projectId/*");
  const pageMatch = useMatch("/projects/:projectId/pages/:pageId");
  const projectId = match?.params.projectId;
  const activePageId = pageMatch?.params.pageId;
  const navigate = useNavigate();

  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: pages, isLoading } = usePages(entry);
  const createPage = useCreatePage(entry);
  const deletePage = useDeletePage(entry);
  const movePage = useMovePage(entry);

  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!entry) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entry]);

  if (!entry) return null;

  const handleNewPage = async () => {
    const page = await createPage.mutateAsync(undefined);
    navigate(`/projects/${entry.id}/pages/${page.id}`);
  };

  return (
    <aside className="w-full h-full bg-neutral-950 flex flex-col p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 truncate">
          {entry.name}
        </h2>
        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${entry.id}/findings`}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Findings
          </Link>
          <Link
            to={`/projects/${entry.id}/evidence`}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Evidence
          </Link>
          <Link
            to={`/projects/${entry.id}/screenshots`}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Screenshots
          </Link>
          <Link
            to={`/projects/${entry.id}/assets`}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Assets
          </Link>
          <Link
            to={`/projects/${entry.id}/graph`}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Graph
          </Link>
          <Button
            variant="ghost"
            className="text-xs px-2 py-1"
            disabled={createPage.isPending}
            onClick={handleNewPage}
          >
            {createPage.isPending ? "…" : "+ Page"}
          </Button>
        </div>
      </div>

      <button
        onClick={() => setShowSearch(true)}
        className="mb-3 flex w-full items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-left text-xs text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
        title="Search pages, findings, evidence, assets"
      >
        <span>🔍</span>
        <span className="flex-1">Search…</span>
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">
          Ctrl+K
        </span>
      </button>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="text-xs text-neutral-500 px-2">Loading…</p>}
        {!isLoading && pages?.length === 0 && (
          <p className="text-xs text-neutral-500 px-2">No pages yet.</p>
        )}
        {pages && (
          <PageTree
            pages={pages}
            projectId={entry.id}
            activePageId={activePageId}
            onDelete={(pageId) => deletePage.mutate(pageId)}
            onMove={(input) => movePage.mutate(input)}
          />
        )}
      </div>

      <SearchModal open={showSearch} entry={entry} onClose={() => setShowSearch(false)} />
    </aside>
  );
}
