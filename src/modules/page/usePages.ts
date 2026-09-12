import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openProjectDb } from "../../db/client";
import type { JsonValue } from "../../shared/types";
import type { CatalogEntry } from "../workspace/workspace.types";
import {
  createPage,
  getPage,
  listPages,
  softDeletePage,
  updatePageBlocks,
  updatePageData,
  updatePageOrder,
  updatePageTitle,
} from "./page.repository";
import { listBacklinksForPage, replaceOutgoingLinks, type LinkTarget } from "./page_link.repository";
import type { Page } from "./page.types";

/** True if `candidateId` is `ancestorId` itself or nested anywhere under it — used to block drag-and-drop moves that would make a page its own descendant. */
function isSelfOrDescendant(pages: Page[], ancestorId: string, candidateId: string): boolean {
  let current: string | null = candidateId;
  while (current !== null) {
    if (current === ancestorId) return true;
    current = pages.find((page) => page.id === current)?.parentId ?? null;
  }
  return false;
}

function dbPathFor(entry: CatalogEntry): string {
  return `${entry.folderPath}/project.sqlite`;
}

export function usePages(entry: CatalogEntry | null) {
  return useQuery({
    queryKey: ["pages", entry?.id],
    queryFn: async () => {
      if (!entry) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listPages(db, entry.id);
    },
    enabled: entry !== null,
  });
}

export function usePage(entry: CatalogEntry | null, pageId: string | undefined) {
  return useQuery({
    queryKey: ["page", entry?.id, pageId],
    queryFn: async () => {
      if (!entry || !pageId) return null;
      const db = await openProjectDb(dbPathFor(entry));
      return getPage(db, pageId);
    },
    enabled: entry !== null && pageId !== undefined,
  });
}

export function useCreatePage(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input?: { title?: string; parentId?: string | null }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      return createPage(db, entry.id, input?.title, input?.parentId ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", entry?.id] });
    },
  });
}

export function useUpdatePageTitle(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, title }: { pageId: string; title: string }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await updatePageTitle(db, pageId, title);
    },
    onSuccess: (_result, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["pages", entry?.id] });
      queryClient.invalidateQueries({ queryKey: ["page", entry?.id, pageId] });
    },
  });
}

export function useUpdatePageBlocks(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, blocks }: { pageId: string; blocks: JsonValue }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await updatePageBlocks(db, pageId, blocks);
    },
    onError: (error) => console.error("Failed to save page content", error),
    onSuccess: (_result, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["page", entry?.id, pageId] });
      // The graph and the @mention suggestion list both read block content
      // straight from the "pages" list query, not the singular one above —
      // without this they'd keep showing this page's evidence/mention links
      // as they were before the edit.
      queryClient.invalidateQueries({ queryKey: ["pages", entry?.id] });
    },
  });
}

export function useUpdatePageData(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      data,
    }: {
      pageId: string;
      data: Record<string, JsonValue>;
    }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await updatePageData(db, pageId, data);
    },
    onSuccess: (_result, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["page", entry?.id, pageId] });
    },
  });
}

export function useSyncPageLinks(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      targets,
    }: {
      pageId: string;
      targets: LinkTarget[];
    }) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await replaceOutgoingLinks(db, pageId, targets);
    },
    onError: (error) => console.error("Failed to sync page links", error),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlinks", entry?.id] });
    },
  });
}

export function useBacklinks(entry: CatalogEntry | null, pageId: string | undefined) {
  return useQuery({
    queryKey: ["backlinks", entry?.id, pageId],
    queryFn: async () => {
      if (!entry || !pageId) return [];
      const db = await openProjectDb(dbPathFor(entry));
      return listBacklinksForPage(db, pageId);
    },
    enabled: entry !== null && pageId !== undefined,
  });
}

export interface MovePageInput {
  pageId: string;
  /** The page being dropped onto, used to derive the new parent + sibling position — never the moved page itself. */
  targetId: string;
  /** "before"/"after" targetId as a sibling (adopting targetId's parent), or "inside" to become targetId's last child. */
  position: "before" | "after" | "inside";
}

export function useMovePage(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, targetId, position }: MovePageInput) => {
      if (!entry) throw new Error("No active project");
      if (pageId === targetId) return;
      const db = await openProjectDb(dbPathFor(entry));
      const allPages = await listPages(db, entry.id);

      const target = allPages.find((page) => page.id === targetId);
      if (!target) return;
      // Dropping a page onto its own descendant (or itself) would create a cycle.
      if (isSelfOrDescendant(allPages, pageId, targetId)) return;

      const newParentId = position === "inside" ? target.id : target.parentId;
      const siblings = allPages
        .filter((page) => page.parentId === newParentId && page.id !== pageId)
        .sort((a, b) => a.orderKey.localeCompare(b.orderKey));

      let insertIndex = siblings.length;
      if (position !== "inside") {
        const targetIndex = siblings.findIndex((page) => page.id === targetId);
        insertIndex = position === "before" ? targetIndex : targetIndex + 1;
      }

      const orderedIds = siblings.map((page) => page.id);
      orderedIds.splice(insertIndex, 0, pageId);

      for (let i = 0; i < orderedIds.length; i++) {
        await updatePageOrder(db, orderedIds[i], newParentId, String(i).padStart(6, "0"));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", entry?.id] });
    },
  });
}

export function useDeletePage(entry: CatalogEntry | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      if (!entry) throw new Error("No active project");
      const db = await openProjectDb(dbPathFor(entry));
      await softDeletePage(db, pageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", entry?.id] });
    },
  });
}
