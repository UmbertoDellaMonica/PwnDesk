import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import type { CatalogEntry } from "../../workspace/workspace.types";
import type { Asset } from "../finding.types";
import { useAddFindingAsset, useFindingAssets, useRemoveFindingAsset } from "../useFindings";

interface FindingAssetsPanelProps {
  entry: CatalogEntry;
  findingId: string;
}

const ASSET_TYPES: Asset["assetType"][] = ["host", "url", "api", "credential", "other"];

export function FindingAssetsPanel({ entry, findingId }: FindingAssetsPanelProps) {
  const { data: assets } = useFindingAssets(entry, findingId);
  const addAsset = useAddFindingAsset(entry, findingId);
  const removeAsset = useRemoveFindingAsset(entry, findingId);

  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<Asset["assetType"]>("host");

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addAsset.mutateAsync({ name: name.trim(), assetType });
    setName("");
  };

  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-neutral-300">Affected assets</h2>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {assets?.map((asset) => (
          <span
            key={asset.id}
            className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
          >
            <span className="text-neutral-500">{asset.assetType}</span> {asset.name}
            <button
              className="text-neutral-500 hover:text-red-400"
              onClick={() => removeAsset.mutate(asset.id)}
            >
              ✕
            </button>
          </span>
        ))}
        {assets?.length === 0 && <p className="text-xs text-neutral-500">No assets linked yet.</p>}
      </div>

      <div className="flex gap-2">
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
        <Button
          variant="secondary"
          className="text-xs"
          onClick={handleAdd}
          disabled={!name.trim() || addAsset.isPending}
        >
          {addAsset.isPending ? "Adding…" : "Add"}
        </Button>
      </div>
    </div>
  );
}
