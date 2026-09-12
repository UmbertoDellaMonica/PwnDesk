import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openProjectDb } from "../../db/client";
import type { CatalogEntry } from "../workspace/workspace.types";
import {
  createFinding,
  createFindingFromEvidence,
  deleteAsset,
  deleteFinding,
  findOrCreateAsset,
  getAsset,
  getFinding,
  linkAsset,
  linkEvidence,
  listAllFindingAssetLinks,
  listAllFindingEvidenceLinks,
  listAssets,
  listAssetsForFinding,
  listEvidenceIdsForFinding,
  listFindings,
  listFindingsForAsset,
  listFindingsForEvidence,
  promoteVulnNoteToFinding,
  unlinkAsset,
  unlinkEvidence,
  updateAsset,
  updateFinding,
} from "./finding.repository";
import type { Asset, Finding, FindingData, FindingSeverity, FindingStatus } from "./finding.types";

function dbPathFor(entry: CatalogEntry): string {
  return `${entry.folderPath}/project.sqlite`;
}

export function useFindings(entry: CatalogEntry | null) {
  return useQuery({
    queryKey: ["findings", entry?.id],
    queryFn: async () => {
      if (!entry) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listFindings(db);
    },
    enabled: entry !== null,
  });
}

export function useFinding(entry: CatalogEntry | null, findingId: string | undefined) {
  return useQuery({
    queryKey: ["finding", entry?.id, findingId],
    queryFn: async () => {
      if (!entry || !findingId) return null;
      const db = await openProjectDb(dbPathFor(entry));
      return getFinding(db, findingId);
    },
    enabled: entry !== null && findingId !== undefined,
  });
}

export function useCreateFinding(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; displayId?: string | null }): Promise<Finding> => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      return createFinding(db, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findings", entry?.id] });
    },
  });
}

export function useCreateFindingFromEvidence(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      category: string;
      reproductionHint: string;
      evidenceId: string;
    }): Promise<Finding> => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      return createFindingFromEvidence(db, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findings", entry?.id] });
    },
  });
}

export function usePromoteVulnNote(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      reproduction: string;
      category: string;
      cvssVector: string | null;
      cvssScore: number | null;
      severity: FindingSeverity | null;
      evidenceIds: string[];
      evidenceCaptions: Record<string, string>;
    }): Promise<Finding> => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      return promoteVulnNoteToFinding(db, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findings", entry?.id] });
    },
  });
}

export function useFindingsForEvidence(entry: CatalogEntry | null, evidenceId: string | undefined) {
  return useQuery({
    queryKey: ["findingsForEvidence", entry?.id, evidenceId],
    queryFn: async () => {
      if (!entry || !evidenceId) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listFindingsForEvidence(db, evidenceId);
    },
    enabled: entry !== null && evidenceId !== undefined,
  });
}

export function useUpdateFindingEvidenceCaption(
  entry: CatalogEntry | null,
  findingId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      evidenceId,
      caption,
      currentData,
    }: {
      evidenceId: string;
      caption: string;
      currentData: FindingData;
    }) => {
      if (!entry || !findingId) throw new Error("No active finding");
      const db = await openProjectDb(dbPathFor(entry));
      await updateFinding(db, findingId, {
        data: {
          ...currentData,
          evidenceCaptions: { ...currentData.evidenceCaptions, [evidenceId]: caption },
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finding", entry?.id, findingId] });
    },
  });
}

export function useUpdateFinding(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      findingId,
      patch,
    }: {
      findingId: string;
      patch: Partial<{
        title: string;
        status: FindingStatus;
        severity: FindingSeverity | null;
        cvssVector: string | null;
        cvssScore: number | null;
        data: FindingData;
      }>;
    }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await updateFinding(db, findingId, patch);
    },
    onSuccess: (_result, { findingId }) => {
      queryClient.invalidateQueries({ queryKey: ["findings", entry?.id] });
      queryClient.invalidateQueries({ queryKey: ["finding", entry?.id, findingId] });
    },
  });
}

export function useDeleteFinding(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (findingId: string) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await deleteFinding(db, findingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findings", entry?.id] });
    },
  });
}

export function useFindingEvidenceIds(entry: CatalogEntry | null, findingId: string | undefined) {
  return useQuery({
    queryKey: ["findingEvidence", entry?.id, findingId],
    queryFn: async () => {
      if (!entry || !findingId) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listEvidenceIdsForFinding(db, findingId);
    },
    enabled: entry !== null && findingId !== undefined,
  });
}

export function useLinkFindingEvidence(entry: CatalogEntry | null, findingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evidenceId: string) => {
      if (!entry || !findingId) throw new Error("No active finding");
      const db = await openProjectDb(dbPathFor(entry));
      await linkEvidence(db, findingId, evidenceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findingEvidence", entry?.id, findingId] });
      queryClient.invalidateQueries({ queryKey: ["allFindingEvidenceLinks", entry?.id] });
    },
  });
}

export function useUnlinkFindingEvidence(
  entry: CatalogEntry | null,
  findingId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evidenceId: string) => {
      if (!entry || !findingId) throw new Error("No active finding");
      const db = await openProjectDb(dbPathFor(entry));
      await unlinkEvidence(db, findingId, evidenceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findingEvidence", entry?.id, findingId] });
      queryClient.invalidateQueries({ queryKey: ["allFindingEvidenceLinks", entry?.id] });
    },
  });
}

export function useLinkEvidenceToAnyFinding(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ findingId, evidenceId }: { findingId: string; evidenceId: string }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await linkEvidence(db, findingId, evidenceId);
    },
    onSuccess: (_result, { findingId, evidenceId }) => {
      queryClient.invalidateQueries({ queryKey: ["findingEvidence", entry?.id, findingId] });
      queryClient.invalidateQueries({ queryKey: ["findingsForEvidence", entry?.id, evidenceId] });
      queryClient.invalidateQueries({ queryKey: ["allFindingEvidenceLinks", entry?.id] });
    },
  });
}

export function useAllFindingEvidenceLinks(entry: CatalogEntry | null) {
  return useQuery({
    queryKey: ["allFindingEvidenceLinks", entry?.id],
    queryFn: async () => {
      if (!entry) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listAllFindingEvidenceLinks(db);
    },
    enabled: entry !== null,
  });
}

export function useAllFindingAssetLinks(entry: CatalogEntry | null) {
  return useQuery({
    queryKey: ["allFindingAssetLinks", entry?.id],
    queryFn: async () => {
      if (!entry) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listAllFindingAssetLinks(db);
    },
    enabled: entry !== null,
  });
}

export function useAssets(entry: CatalogEntry | null) {
  return useQuery({
    queryKey: ["assets", entry?.id],
    queryFn: async () => {
      if (!entry) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listAssets(db);
    },
    enabled: entry !== null,
  });
}

export function useAsset(entry: CatalogEntry | null, assetId: string | undefined) {
  return useQuery({
    queryKey: ["asset", entry?.id, assetId],
    queryFn: async () => {
      if (!entry || !assetId) return null;
      const db = await openProjectDb(dbPathFor(entry));
      return getAsset(db, assetId);
    },
    enabled: entry !== null && assetId !== undefined,
  });
}

export function useCreateAsset(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; assetType: Asset["assetType"] }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      return findOrCreateAsset(db, input.name, input.assetType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", entry?.id] });
    },
  });
}

export function useUpdateAsset(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetId,
      patch,
    }: {
      assetId: string;
      patch: { name?: string; assetType?: Asset["assetType"] };
    }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await updateAsset(db, assetId, patch);
    },
    onSuccess: (_result, { assetId }) => {
      queryClient.invalidateQueries({ queryKey: ["assets", entry?.id] });
      queryClient.invalidateQueries({ queryKey: ["asset", entry?.id, assetId] });
    },
  });
}

export function useDeleteAsset(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await deleteAsset(db, assetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", entry?.id] });
      queryClient.invalidateQueries({ queryKey: ["allFindingAssetLinks", entry?.id] });
    },
  });
}

export function useFindingsForAsset(entry: CatalogEntry | null, assetId: string | undefined) {
  return useQuery({
    queryKey: ["findingsForAsset", entry?.id, assetId],
    queryFn: async () => {
      if (!entry || !assetId) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listFindingsForAsset(db, assetId);
    },
    enabled: entry !== null && assetId !== undefined,
  });
}

export function useFindingAssets(entry: CatalogEntry | null, findingId: string | undefined) {
  return useQuery({
    queryKey: ["findingAssets", entry?.id, findingId],
    queryFn: async () => {
      if (!entry || !findingId) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listAssetsForFinding(db, findingId);
    },
    enabled: entry !== null && findingId !== undefined,
  });
}

export function useAddFindingAsset(entry: CatalogEntry | null, findingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; assetType: Asset["assetType"] }) => {
      if (!entry || !findingId) throw new Error("No active finding");
      const db = await openProjectDb(dbPathFor(entry));
      const asset = await findOrCreateAsset(db, input.name, input.assetType);
      await linkAsset(db, findingId, asset.id);
      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findingAssets", entry?.id, findingId] });
      queryClient.invalidateQueries({ queryKey: ["assets", entry?.id] });
      queryClient.invalidateQueries({ queryKey: ["allFindingAssetLinks", entry?.id] });
    },
  });
}

export function useRemoveFindingAsset(entry: CatalogEntry | null, findingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      if (!entry || !findingId) throw new Error("No active finding");
      const db = await openProjectDb(dbPathFor(entry));
      await unlinkAsset(db, findingId, assetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["findingAssets", entry?.id, findingId] });
      queryClient.invalidateQueries({ queryKey: ["allFindingAssetLinks", entry?.id] });
    },
  });
}
