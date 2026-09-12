import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../shared/ui/Button";
import { useProjects } from "../../modules/project/useProjects";
import { SECTION_DESCRIPTIONS } from "../../modules/project/methodology";
import { useCreatePage, usePages } from "../../modules/page/usePages";

export function ProjectHome() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: pages } = usePages(entry);
  const createPage = useCreatePage(entry);

  if (!entry) {
    return (
      <div className="p-6 text-neutral-400 text-sm">
        Project not found. Select a project from the sidebar.
      </div>
    );
  }

  const handleNewPage = async () => {
    const page = await createPage.mutateAsync(undefined);
    navigate(`/projects/${entry.id}/pages/${page.id}`);
  };

  const topLevelPages = (pages ?? []).filter((page) => page.parentId === null);

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-100">{entry.name}</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Created {new Date(entry.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-300">Pages</h2>
          <Button
            variant="secondary"
            className="text-xs"
            disabled={createPage.isPending}
            onClick={handleNewPage}
          >
            {createPage.isPending ? "Creating…" : "+ New page"}
          </Button>
        </div>

        {topLevelPages.length === 0 ? (
          <p className="text-sm text-neutral-400">No pages yet — create one to start taking notes.</p>
        ) : (
          <ul className="space-y-1.5">
            {topLevelPages.map((page) => (
              <li key={page.id}>
                <Link
                  to={`/projects/${entry.id}/pages/${page.id}`}
                  className="block rounded-md bg-neutral-800/60 px-3 py-2 hover:bg-neutral-800"
                >
                  <span className="text-sm text-neutral-200">{page.title}</span>
                  {SECTION_DESCRIPTIONS[page.title] && (
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {SECTION_DESCRIPTIONS[page.title]}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
