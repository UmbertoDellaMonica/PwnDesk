import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLayoutStore } from "../../../app/layoutStore";
import { Button } from "../../../shared/ui/Button";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { useActiveProjectStore } from "../useActiveProject";
import { useOpenProject, useProjects } from "../useProjects";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { NewProjectDialog } from "./NewProjectDialog";
import { ProjectListItem } from "./ProjectListItem";

export function ProjectSidebar() {
  const { data: projects, isLoading } = useProjects();
  const activeEntry = useActiveProjectStore((state) => state.activeEntry);
  const openProject = useOpenProject();
  const navigate = useNavigate();
  const collapsed = useLayoutStore((state) => state.projectSidebarCollapsed);
  const toggleCollapsed = useLayoutStore((state) => state.toggleProjectSidebar);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogEntry | null>(null);

  const handleOpen = async (entry: CatalogEntry) => {
    await openProject.mutateAsync(entry);
    navigate(`/projects/${entry.id}`);
  };

  if (collapsed) {
    return (
      <aside className="h-full w-full bg-neutral-950 border-r border-neutral-800 flex flex-col items-center py-3">
        <button
          onClick={toggleCollapsed}
          title="Show projects"
          className="text-neutral-500 hover:text-neutral-200"
        >
          »
        </button>
      </aside>
    );
  }

  return (
    <aside className="h-full w-full bg-neutral-950 border-r border-neutral-800 flex flex-col p-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-sm font-semibold text-neutral-200 tracking-wide">PwnDesk</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => setShowNewDialog(true)}>
            + New
          </Button>
          <button
            onClick={toggleCollapsed}
            title="Collapse projects panel"
            className="text-neutral-500 hover:text-neutral-200 px-1"
          >
            «
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {isLoading && <p className="text-xs text-neutral-500 px-2">Loading…</p>}
        {!isLoading && projects?.length === 0 && (
          <p className="text-xs text-neutral-500 px-2">No projects yet.</p>
        )}
        {projects?.map((entry) => (
          <ProjectListItem
            key={entry.id}
            entry={entry}
            active={activeEntry?.id === entry.id}
            onOpen={() => handleOpen(entry)}
            onDelete={() => setDeleteTarget(entry)}
          />
        ))}
      </div>

      <NewProjectDialog open={showNewDialog} onClose={() => setShowNewDialog(false)} />
      <DeleteProjectDialog entry={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </aside>
  );
}
