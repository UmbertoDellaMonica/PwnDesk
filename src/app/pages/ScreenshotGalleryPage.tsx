import { useParams } from "react-router-dom";
import { ScreenshotGallery } from "../../modules/evidence/ui/ScreenshotGallery";
import { useProjects } from "../../modules/project/useProjects";

export function ScreenshotGalleryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  if (!entry) {
    return <div className="p-6 text-sm text-neutral-400">Project not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="mb-4 text-xl font-semibold text-neutral-100">Screenshots</h1>
      <ScreenshotGallery entry={entry} />
    </div>
  );
}
