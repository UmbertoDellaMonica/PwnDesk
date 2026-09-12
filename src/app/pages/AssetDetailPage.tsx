import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Asset } from "../../modules/finding/finding.types";
import {
  useAsset,
  useDeleteAsset,
  useFindingsForAsset,
  useUpdateAsset,
} from "../../modules/finding/useFindings";
import { findPagesReferencingTarget } from "../../modules/page/page.utils";
import { usePages } from "../../modules/page/usePages";
import { useProjects } from "../../modules/project/useProjects";
import { Button } from "../../shared/ui/Button";
import { SeverityBadge } from "../../shared/ui/Badge";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { showToast } from "../../shared/ui/toastStore";

const ASSET_TYPES: Asset["assetType"][] = ["host", "url", "api", "credential", "other"];

export function AssetDetailPage() {
  const { projectId, assetId } = useParams<{ projectId: string; assetId: string }>();
  const navigate = useNavigate();

  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: asset, isLoading } = useAsset(entry, assetId);
  const { data: findings } = useFindingsForAsset(entry, assetId);
  const { data: pages } = usePages(entry);
  const updateAsset = useUpdateAsset(entry);
  const deleteAsset = useDeleteAsset(entry);

  const [nameDraft, setNameDraft] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setNameDraft(asset?.name ?? "");
  }, [asset?.id, asset?.name]);

  if (!entry) return <div className="p-6 text-sm text-neutral-400">Project not found.</div>;
  if (isLoading) return <div className="p-6 text-sm text-neutral-500">Loading…</div>;
  if (!asset || !assetId) {
    return <div className="p-6 text-sm text-neutral-400">Asset not found — it may have been removed.</div>;
  }

  const referencingPages = findPagesReferencingTarget(pages ?? [], "asset", assetId);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== asset.name) {
      updateAsset.mutate({ assetId, patch: { name: trimmed } });
    }
  };

  const handleDelete = async () => {
    await deleteAsset.mutateAsync(assetId);
    showToast(`Deleted asset "${asset.name}"`);
    navigate(`/projects/${entry.id}/assets`);
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <button
        className="text-xs text-neutral-500 hover:text-neutral-300"
        onClick={() => navigate(`/projects/${entry.id}/assets`)}
      >
        ← Back to assets
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={asset.assetType}
          onChange={(event) =>
            updateAsset.mutate({
              assetId,
              patch: { assetType: event.target.value as Asset["assetType"] },
            })
          }
          className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          {ASSET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitName();
            }
          }}
          className="flex-1 bg-transparent text-2xl font-semibold text-neutral-100 focus:outline-none"
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Affected in findings</h2>
        {(findings?.length ?? 0) === 0 ? (
          <p className="text-xs text-neutral-500">Not linked to any finding yet.</p>
        ) : (
          <ul className="space-y-1">
            {findings?.map((finding) => (
              <li key={finding.id}>
                <Link
                  to={`/projects/${entry.id}/findings/${finding.id}`}
                  className="flex items-center gap-2 rounded-md bg-neutral-800/60 px-3 py-2 hover:bg-neutral-800"
                >
                  {finding.displayId && (
                    <span className="font-mono text-xs text-neutral-500">{finding.displayId}</span>
                  )}
                  <span className="flex-1 truncate text-sm text-neutral-200">{finding.title}</span>
                  <SeverityBadge severity={finding.severity} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Referenced in pages</h2>
        {referencingPages.length === 0 ? (
          <p className="text-xs text-neutral-500">
            Not mentioned in any page yet — type @{asset.name} in a page to link it here.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {referencingPages.map((page) => (
              <li key={page.id}>
                <Link
                  to={`/projects/${entry.id}/pages/${page.id}`}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-4">
        <Button variant="danger" disabled={deleteAsset.isPending} onClick={() => setShowDeleteConfirm(true)}>
          {deleteAsset.isPending ? "Deleting…" : "Delete asset"}
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete asset"
        message={`This permanently deletes "${asset.name}" and removes it from every finding that references it. This cannot be undone.`}
        isPending={deleteAsset.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
