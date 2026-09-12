import { create } from "zustand";
import type { CatalogEntry } from "../workspace/workspace.types";

interface ActiveProjectState {
  activeEntry: CatalogEntry | null;
  setActiveEntry: (entry: CatalogEntry | null) => void;
}

export const useActiveProjectStore = create<ActiveProjectState>((set) => ({
  activeEntry: null,
  setActiveEntry: (entry) => set({ activeEntry: entry }),
}));
