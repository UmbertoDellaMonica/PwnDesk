import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { MentionItem } from "../../modules/page/editor/extensions/mention";
import { PageEditor } from "../../modules/page/editor/PageEditor";
import { usePageLookupStore } from "../../modules/page/editor/pageLookupStore";
import { BacklinksPanel } from "../../modules/page/ui/BacklinksPanel";
import { TagChips } from "../../modules/page/ui/TagChips";
import { useAssets, useFindings } from "../../modules/finding/useFindings";
import { useProjects } from "../../modules/project/useProjects";
import {
  useCreatePage,
  useDeletePage,
  usePage,
  usePages,
  useSyncPageLinks,
  useUpdatePageBlocks,
  useUpdatePageData,
  useUpdatePageTitle,
} from "../../modules/page/usePages";
import { Button } from "../../shared/ui/Button";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { showToast } from "../../shared/ui/toastStore";

export function PageView() {
  const { projectId, pageId } = useParams<{ projectId: string; pageId: string }>();
  const navigate = useNavigate();

  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: page, isLoading } = usePage(entry, pageId);
  const { data: allPages } = usePages(entry);
  const { data: allFindings } = useFindings(entry);
  const { data: allAssets } = useAssets(entry);
  const updateTitle = useUpdatePageTitle(entry);
  const updateBlocks = useUpdatePageBlocks(entry);
  const updateData = useUpdatePageData(entry);
  const syncLinks = useSyncPageLinks(entry);
  const deletePage = useDeletePage(entry);
  const createPage = useCreatePage(entry);

  const [titleDraft, setTitleDraft] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setTitleDraft(page?.title ?? "");
  }, [page?.id, page?.title]);

  useEffect(() => {
    if (entry && allPages) {
      usePageLookupStore.getState().setLookup(entry.id, allPages);
    }
  }, [entry, allPages]);

  const mentionItems: MentionItem[] = useMemo(
    () => [
      ...(allPages ?? []).map((candidate): MentionItem => ({
        id: candidate.id,
        label: candidate.title,
        targetType: "page",
      })),
      ...(allFindings ?? []).map((finding): MentionItem => ({
        id: finding.id,
        label: finding.displayId ? `${finding.displayId} ${finding.title}` : finding.title,
        targetType: "finding",
      })),
      ...(allAssets ?? []).map((asset): MentionItem => ({
        id: asset.id,
        label: asset.name,
        targetType: "asset",
      })),
    ],
    [allPages, allFindings, allAssets],
  );

  if (!entry) {
    return <div className="p-6 text-sm text-neutral-400">Project not found.</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Loading…</div>;
  }

  if (!page) {
    return <div className="p-6 text-sm text-neutral-400">Page not found.</div>;
  }

  const tags = (Array.isArray(page.data.tags) ? page.data.tags : []) as string[];

  const commitTitle = () => {
    const nextTitle = titleDraft.trim() || "Untitled";
    if (nextTitle !== page.title) {
      updateTitle.mutate({ pageId: page.id, title: nextTitle });
    }
  };

  const handleDelete = async () => {
    await deletePage.mutateAsync(page.id);
    showToast(`Deleted page "${page.title}"`);
    navigate(`/projects/${entry.id}`);
  };

  const childPageCount = (allPages ?? []).filter((candidate) => candidate.parentId === page.id).length;

  const handleNewSubPage = async () => {
    const child = await createPage.mutateAsync({ title: "Untitled", parentId: page.id });
    navigate(`/projects/${entry.id}/pages/${child.id}`);
  };

  return (
    <div className="p-6 max-w-3xl">
      <button
        className="text-xs text-neutral-500 hover:text-neutral-300 mb-3"
        onClick={() => navigate(`/projects/${entry.id}`)}
      >
        ← Back to project
      </button>

      <input
        value={titleDraft}
        onChange={(event) => setTitleDraft(event.target.value)}
        onBlur={commitTitle}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitTitle();
          }
        }}
        className="w-full bg-transparent text-2xl font-semibold text-neutral-100 focus:outline-none"
        placeholder="Untitled"
      />

      <div className="mt-2">
        <TagChips
          tags={tags}
          onChange={(nextTags) =>
            updateData.mutate({ pageId: page.id, data: { ...page.data, tags: nextTags } })
          }
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="secondary"
          className="text-xs"
          disabled={createPage.isPending}
          onClick={handleNewSubPage}
        >
          {createPage.isPending ? "Creating…" : "+ Sub-page"}
        </Button>
        <Button
          variant="danger"
          className="text-xs"
          disabled={deletePage.isPending}
          onClick={() => setShowDeleteConfirm(true)}
        >
          {deletePage.isPending ? "Deleting…" : "Delete page"}
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete page"
        message={
          childPageCount > 0
            ? `This deletes "${page.title}" and moves its ${childPageCount} sub-page${childPageCount === 1 ? "" : "s"} up to the top level. This cannot be undone.`
            : `This permanently deletes "${page.title}". This cannot be undone.`
        }
        isPending={deletePage.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="mt-4">
        <PageEditor
          key={page.id}
          pageId={page.id}
          entry={entry}
          initialContent={page.blocks}
          mentionItems={mentionItems}
          onSave={(blocks) => updateBlocks.mutate({ pageId: page.id, blocks })}
          onLinksChange={(targets) => syncLinks.mutate({ pageId: page.id, targets })}
        />
      </div>

      <BacklinksPanel entry={entry} pageId={page.id} />
    </div>
  );
}
