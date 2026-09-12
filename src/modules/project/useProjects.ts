import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openProjectDb } from "../../db/client";
import { listProjects } from "../workspace/catalog";
import type { CatalogEntry } from "../workspace/workspace.types";
import { getProjectRow } from "./project.repository";
import { useActiveProjectStore } from "./useActiveProject";
import { createProject, deleteProject, openProject } from "./project.service";

const PROJECTS_QUERY_KEY = ["projects"] as const;

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: listProjects,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const setActiveEntry = useActiveProjectStore((state) => state.setActiveEntry);

  return useMutation({
    mutationFn: (input: Parameters<typeof createProject>[0]) => createProject(input),
    onError: (error) => console.error("Failed to create project", error),
    onSuccess: ({ entry }) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      setActiveEntry(entry);
    },
  });
}

export function useProjectDetails(entry: CatalogEntry | null) {
  return useQuery({
    queryKey: ["projectDetails", entry?.id],
    queryFn: async () => {
      if (!entry) return null;
      const db = await openProjectDb(`${entry.folderPath}/project.sqlite`);
      return getProjectRow(db);
    },
    enabled: entry !== null,
  });
}

export function useOpenProject() {
  const setActiveEntry = useActiveProjectStore((state) => state.setActiveEntry);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Parameters<typeof openProject>[0]) => {
      await openProject(entry);
      return entry;
    },
    onSuccess: (entry) => {
      setActiveEntry(entry);
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { activeEntry, setActiveEntry } = useActiveProjectStore();

  return useMutation({
    mutationFn: async (entry: Parameters<typeof deleteProject>[0]) => {
      // Stop any in-flight/cached queries for this project (pages, evidence,
      // findings, etc.) before touching its files — otherwise a background
      // refetch can race the delete and crash on the file/DB it just removed.
      const isScopedToEntry = (queryKey: readonly unknown[]) => queryKey.includes(entry.id);
      await queryClient.cancelQueries({ predicate: (q) => isScopedToEntry(q.queryKey) });
      queryClient.removeQueries({ predicate: (q) => isScopedToEntry(q.queryKey) });

      await deleteProject(entry);
    },
    // Update the visible list immediately, independent of whether the
    // mutation later reports success or failure: unrelated background
    // queries can race the delete and make the *mutation* look like it
    // failed even though the catalog row and files are already gone — the
    // list should reflect that regardless. onSettled re-syncs with the real
    // DB state in both cases, so it self-corrects if the delete genuinely
    // didn't go through.
    onMutate: async (entry) => {
      if (activeEntry?.id === entry.id) setActiveEntry(null);
      await queryClient.cancelQueries({ queryKey: PROJECTS_QUERY_KEY });
      queryClient.setQueryData<CatalogEntry[]>(
        PROJECTS_QUERY_KEY,
        (old) => old?.filter((project) => project.id !== entry.id) ?? [],
      );
    },
    onError: (error) => console.error("Failed to delete project", error),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}
