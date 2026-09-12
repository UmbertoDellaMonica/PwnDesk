import { create } from "zustand";
import type { Page } from "../page.types";

interface PageLookupEntry {
  title: string;
  isDeleted: boolean;
}

interface PageLookupState {
  projectId: string | null;
  pagesById: Record<string, PageLookupEntry>;
  setLookup: (projectId: string, pages: Page[]) => void;
}

export const usePageLookupStore = create<PageLookupState>((set) => ({
  projectId: null,
  pagesById: {},
  setLookup: (projectId, pages) =>
    set({
      projectId,
      pagesById: Object.fromEntries(
        pages.map((page) => [page.id, { title: page.title, isDeleted: page.isDeleted }]),
      ),
    }),
}));
