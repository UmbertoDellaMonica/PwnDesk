import { useEffect } from "react";
import { useMatch } from "react-router-dom";
import { useProjects } from "../project/useProjects";
import { useAssetLookupStore } from "./assetLookupStore";
import { useFindingLookupStore } from "./findingLookupStore";
import { useAssets, useFindings } from "./useFindings";

export function FindingLookupSync() {
  const match = useMatch("/projects/:projectId/*");
  const projectId = match?.params.projectId;

  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: findings } = useFindings(entry);
  const { data: assets } = useAssets(entry);

  useEffect(() => {
    if (entry && findings) {
      useFindingLookupStore.getState().setLookup(entry.id, findings);
    }
  }, [entry, findings]);

  useEffect(() => {
    if (entry && assets) {
      useAssetLookupStore.getState().setLookup(entry.id, assets);
    }
  }, [entry, assets]);

  return null;
}
