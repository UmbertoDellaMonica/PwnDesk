import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useAllFindingAssetLinks,
  useAssets,
  useCreateAsset,
} from "../../modules/finding/useFindings";
import type { Asset } from "../../modules/finding/finding.types";
import { useProjects } from "../../modules/project/useProjects";
import { Button } from "../../shared/ui/Button";
import { Input } from "../../shared/ui/Input";
import { showToast } from "../../shared/ui/toastStore";

const ASSET_TYPES: Asset["assetType"][] = ["host", "url", "api", "credential", "other"];

export function AssetsListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: assets, isLoading } = useAssets(entry);
  const { data: links } = useAllFindingAssetLinks(entry);
  const createAsset = useCreateAsset(entry);

  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<Asset["assetType"]>("host");

  const findingCountByAsset = useMemo(() => {
    const counts = new Map<string, number>();
    for (const link of links ?? []) {
      counts.set(link.assetId, (counts.get(link.assetId) ?? 0) + 1);
    }
    return counts;
  }, [links]);

  if (!entry) {
    return <div className="p-6 text-sm text-neutral-400">Project not found.</div>;
  }

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createAsset.mutateAsync({ name: name.trim(), assetType });
    showToast(`Added asset "${name.trim()}"`);
    setName("");
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold text-neutral-100">Assets</h1>
      </div>
      <p className="mb-4 text-sm text-neutral-500">
        Everything tracked as an affected asset across this project's findings and pages —
        deduped by name + type. Create one here to reuse it later, or add it directly from a
        Finding's "Affected assets" panel.
      </p>

      <div className="mb-6 flex gap-2">
        <select
          value={assetType}
          onChange={(event) => setAssetType(event.target.value as Asset["assetType"])}
          className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          {ASSET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder="e.g. app.example.com"
        />
        <Button disabled={!name.trim() || createAsset.isPending} onClick={handleAdd}>
          {createAsset.isPending ? "Adding…" : "+ Add asset"}
        </Button>
      </div>

      {isLoading && <p className="text-xs text-neutral-500">Loading…</p>}
      {!isLoading && assets?.length === 0 && (
        <p className="text-sm text-neutral-500">No assets yet.</p>
      )}

      <ul className="space-y-1.5">
        {assets?.map((asset) => (
          <li key={asset.id}>
            <Link
              to={`/projects/${entry.id}/assets/${asset.id}`}
              className="flex items-center gap-3 rounded-md bg-neutral-800/60 px-3 py-2 hover:bg-neutral-800"
            >
              <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
                {asset.assetType}
              </span>
              <span className="flex-1 truncate text-sm text-neutral-200">{asset.name}</span>
              <span className="text-xs text-neutral-500">
                {findingCountByAsset.get(asset.id) ?? 0} finding
                {(findingCountByAsset.get(asset.id) ?? 0) === 1 ? "" : "s"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
