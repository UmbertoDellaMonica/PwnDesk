import { create } from "zustand";

const STORAGE_KEY = "pwndesk.layout";

interface PersistedLayout {
  projectSidebarCollapsed: boolean;
  projectSidebarWidth: number;
  pageTreeWidth: number;
}

const DEFAULTS: PersistedLayout = {
  projectSidebarCollapsed: false,
  projectSidebarWidth: 256,
  pageTreeWidth: 240,
};

function loadInitial(): PersistedLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PersistedLayout>;
    return {
      projectSidebarCollapsed: parsed.projectSidebarCollapsed ?? DEFAULTS.projectSidebarCollapsed,
      projectSidebarWidth: parsed.projectSidebarWidth ?? DEFAULTS.projectSidebarWidth,
      pageTreeWidth: parsed.pageTreeWidth ?? DEFAULTS.pageTreeWidth,
    };
  } catch {
    // Malformed/foreign localStorage value — fall back to defaults rather than crash the shell.
    return DEFAULTS;
  }
}

function persist(state: PersistedLayout): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface LayoutState extends PersistedLayout {
  toggleProjectSidebar: () => void;
  setProjectSidebarWidth: (width: number) => void;
  setPageTreeWidth: (width: number) => void;
  /** Writes the current in-memory state to localStorage. Widths are updated many times per second during a drag — persisting on every change would mean synchronous disk I/O on every pointermove, which is its own source of jank. Call this once, on drag end. */
  persistLayout: () => void;
}

export const PROJECT_SIDEBAR_MIN = 180;
export const PROJECT_SIDEBAR_MAX = 480;
export const PAGE_TREE_MIN = 180;
export const PAGE_TREE_MAX = 480;
export const COLLAPSED_RAIL_WIDTH = 44;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  ...loadInitial(),
  toggleProjectSidebar: () =>
    set((state) => {
      const next = { ...state, projectSidebarCollapsed: !state.projectSidebarCollapsed };
      persist(next);
      return next;
    }),
  setProjectSidebarWidth: (width) =>
    set((state) => ({
      ...state,
      projectSidebarWidth: clamp(width, PROJECT_SIDEBAR_MIN, PROJECT_SIDEBAR_MAX),
    })),
  setPageTreeWidth: (width) =>
    set((state) => ({
      ...state,
      pageTreeWidth: clamp(width, PAGE_TREE_MIN, PAGE_TREE_MAX),
    })),
  persistLayout: () => persist(get()),
}));
