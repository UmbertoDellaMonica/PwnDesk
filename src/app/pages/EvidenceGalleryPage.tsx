import { useParams, useSearchParams } from "react-router-dom";
import { EvidenceGallery } from "../../modules/evidence/ui/EvidenceGallery";
import { useProjects } from "../../modules/project/useProjects";

export function EvidenceGalleryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  if (!entry) {
    return <div className="p-6 text-sm text-neutral-400">Project not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="mb-4 text-xl font-semibold text-neutral-100">Evidence</h1>
      <EvidenceGallery entry={entry} initialPreviewId={searchParams.get("preview") ?? undefined} />
    </div>
  );
}
