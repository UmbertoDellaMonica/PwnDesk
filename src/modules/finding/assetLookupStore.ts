import { create } from "zustand";
import type { Asset } from "./finding.types";

interface AssetLookupEntry {
  name: string;
  assetType: Asset["assetType"];
}

interface AssetLookupState {
  projectId: string | null;
  assetsById: Record<string, AssetLookupEntry>;
  setLookup: (projectId: string, assets: Asset[]) => void;
}

export const useAssetLookupStore = create<AssetLookupState>((set) => ({
  projectId: null,
  assetsById: {},
  setLookup: (projectId, assets) =>
    set({
      projectId,
      assetsById: Object.fromEntries(
        assets.map((asset) => [asset.id, { name: asset.name, assetType: asset.assetType }]),
      ),
    }),
}));
