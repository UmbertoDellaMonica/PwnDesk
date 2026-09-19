import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openProjectDb } from "../../db/client";
import type { JsonValue } from "../../shared/types";
import type { CatalogEntry } from "../workspace/workspace.types";
import {
  getEvidenceById,
  listDerivedEvidence,
  listEvidence,
  softDeleteEvidence,
  updateEvidenceData,
} from "./evidence.repository";
import { captureEvidence, deriveEvidence } from "./evidence.service";

function dbPathFor(entry: CatalogEntry): string {
  return `${entry.folderPath}/project.sqlite`;
}

function evidenceDirFor(entry: CatalogEntry): string {
  return `${entry.folderPath}/evidence`;
}

export function useEvidenceList(entry: CatalogEntry | null) {
  return useQuery({
    queryKey: ["evidence", entry?.id],
    queryFn: async () => {
      if (!entry) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listEvidence(db);
    },
    enabled: entry !== null,
  });
}

export function useEvidenceById(entry: CatalogEntry | null, id: string | undefined) {
  return useQuery({
    queryKey: ["evidenceItem", entry?.id, id],
    queryFn: async () => {
      if (!entry || !id) return null;
      const db = await openProjectDb(dbPathFor(entry));
      return getEvidenceById(db, id);
    },
    enabled: entry !== null && id !== undefined,
  });
}

export function useCaptureEvidence(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      initialData,
    }: {
      file: Blob & { name?: string };
      initialData?: Record<string, JsonValue>;
    }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      return captureEvidence(db, evidenceDirFor(entry), file, initialData);
    },
    onError: (error) => console.error("Failed to capture evidence", error),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence", entry?.id] });
    },
  });
}

export function useDerivedEvidence(entry: CatalogEntry | null, evidenceId: string | undefined) {
  return useQuery({
    queryKey: ["derivedEvidence", entry?.id, evidenceId],
    queryFn: async () => {
      if (!entry || !evidenceId) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listDerivedEvidence(db, evidenceId);
    },
    enabled: entry !== null && evidenceId !== undefined,
  });
}

export function useDeriveEvidence(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blob,
      originalName,
      derivedFromId,
    }: {
      blob: Blob;
      originalName: string | null;
      derivedFromId: string;
    }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      return deriveEvidence(db, evidenceDirFor(entry), blob, originalName, derivedFromId);
    },
    onSuccess: (_result, { derivedFromId }) => {
      queryClient.invalidateQueries({ queryKey: ["evidence", entry?.id] });
      queryClient.invalidateQueries({ queryKey: ["derivedEvidence", entry?.id, derivedFromId] });
    },
  });
}

export function useUpdateEvidenceData(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, JsonValue>;
    }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await updateEvidenceData(db, id, data);
    },
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["evidence", entry?.id] });
      queryClient.invalidateQueries({ queryKey: ["evidenceItem", entry?.id, id] });
    },
  });
}

export function useDeleteEvidence(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await softDeleteEvidence(db, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence", entry?.id] });
    },
  });
}
