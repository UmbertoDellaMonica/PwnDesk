import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { slugify } from "../../../shared/lib/slug";
import { errorMessage } from "../../../shared/lib/errorMessage";
import { METHODOLOGIES, type MethodologyId } from "../methodology";
import { useCreateProject } from "../useProjects";

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewProjectDialog({ open, onClose }: NewProjectDialogProps) {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [methodologyId, setMethodologyId] = useState<MethodologyId>("owasp-wstg");
  const createProject = useCreateProject();
  const navigate = useNavigate();

  const handleClose = () => {
    setName("");
    setClientName("");
    setMethodologyId("owasp-wstg");
    createProject.reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const { entry, firstPageId } = await createProject.mutateAsync({
      name: name.trim(),
      clientName: clientName.trim() || undefined,
      methodologyId,
    });
    handleClose();
    // Land on the first seeded page (Scope) directly, not the project home —
    // otherwise the example content the user is about to rely on is invisible
    // until they click into the sidebar tree themselves.
    navigate(`/projects/${entry.id}/pages/${firstPageId}`);
  };

  return (
    <Modal open={open} title="New project" onClose={handleClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Project name</label>
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Web App Pentest Q1"
          />
          {name.trim() && (
            <p className="mt-1 text-xs text-neutral-500">
              Folder: {slugify(name)}-xxxxxx
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Client (optional)</label>
          <Input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Acme Corp"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Methodology</label>
          <select
            value={methodologyId}
            onChange={(event) => setMethodologyId(event.target.value as MethodologyId)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {Object.values(METHODOLOGIES).map((methodology) => (
              <option key={methodology.id} value={methodology.id}>
                {methodology.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            {METHODOLOGIES[methodologyId].description} Seeds the Test Matrix page with its
            top-level categories, plus Scope/Recon/Assets/Findings/Evidence/Timeline.
          </p>
        </div>
        {createProject.isError && (
          <p className="text-xs text-red-400">{errorMessage(createProject.error)}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createProject.isPending}
          >
            {createProject.isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
