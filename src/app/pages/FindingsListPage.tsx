import { useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../../modules/project/useProjects";
import { useCreateFinding, useFindings } from "../../modules/finding/useFindings";
import { Button } from "../../shared/ui/Button";
import { SeverityBadge, StatusBadge } from "../../shared/ui/Badge";

export function FindingsListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: findings, isLoading } = useFindings(entry);
  const createFinding = useCreateFinding(entry);

  if (!entry) {
    return <div className="p-6 text-sm text-neutral-400">Project not found.</div>;
  }

  const handleNewFinding = async () => {
    const finding = await createFinding.mutateAsync({ title: "Untitled finding" });
    navigate(`/projects/${entry.id}/findings/${finding.id}`);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-neutral-100">Findings</h1>
        <Button disabled={createFinding.isPending} onClick={handleNewFinding}>
          {createFinding.isPending ? "Creating…" : "+ New finding"}
        </Button>
      </div>

      {isLoading && <p className="text-xs text-neutral-500">Loading…</p>}
      {!isLoading && findings?.length === 0 && (
        <p className="text-sm text-neutral-500">No findings yet.</p>
      )}

      <ul className="space-y-1.5">
        {findings?.map((finding) => (
          <li key={finding.id}>
            <button
              onClick={() => navigate(`/projects/${entry.id}/findings/${finding.id}`)}
              className="flex w-full items-center gap-3 rounded-md bg-neutral-800/60 px-3 py-2 text-left hover:bg-neutral-800"
            >
              {finding.displayId && (
                <span className="text-xs text-neutral-500 font-mono">{finding.displayId}</span>
              )}
              <span className="flex-1 truncate text-sm text-neutral-200">{finding.title}</span>
              <SeverityBadge severity={finding.severity} />
              <StatusBadge status={finding.status} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
