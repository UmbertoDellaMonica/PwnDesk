import { useEffect } from "react";
import { useMatch } from "react-router-dom";
import { useProjects } from "../project/useProjects";
import { useEvidenceList } from "./useEvidence";
import { useEvidenceLookupStore } from "./evidenceLookupStore";

export function EvidenceLookupSync() {
  const match = useMatch("/projects/:projectId/*");
  const projectId = match?.params.projectId;

  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: evidence } = useEvidenceList(entry);

  useEffect(() => {
    if (entry && evidence) {
      useEvidenceLookupStore.getState().setLookup(entry, evidence);
    }
  }, [entry, evidence]);

  return null;
}
