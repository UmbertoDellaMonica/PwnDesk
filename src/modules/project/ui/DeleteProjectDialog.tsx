import { useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import { errorMessage } from "../../../shared/lib/errorMessage";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { useDeleteProject } from "../useProjects";

interface DeleteProjectDialogProps {
  entry: CatalogEntry | null;
  onClose: () => void;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function DeleteProjectDialog({ entry, onClose }: DeleteProjectDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();
  const routeMatch = useMatch("/projects/:projectId/*");

  const handleClose = () => {
    setConfirmed(false);
    deleteProject.reset();
    onClose();
  };

  const handleDelete = async () => {
    if (!entry) return;
    // If any page/evidence/findings route for this project is currently mounted,
    // it keeps querying the project's DB in the background. Navigate away first
    // and give React a beat to unmount those queries, otherwise they race the
    // file/DB deletion below (surfaces as "connection on a closed pool").
    if (routeMatch?.params.projectId === entry.id) {
      navigate("/");
      await wait(50);
    }
    await deleteProject.mutateAsync(entry);
    handleClose();
  };

  return (
    <Modal open={entry !== null} title="Delete project" onClose={handleClose}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-300">
          This permanently deletes <span className="font-semibold">{entry?.name}</span>,
          including its notes and all evidence on disk. This cannot be undone.
        </p>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          I understand this deletes everything for this project.
        </label>
        {deleteProject.isError && (
          <p className="text-xs text-red-400">{errorMessage(deleteProject.error)}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!confirmed || deleteProject.isPending}
            onClick={handleDelete}
          >
            {deleteProject.isPending ? "Deleting…" : "Delete project"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
