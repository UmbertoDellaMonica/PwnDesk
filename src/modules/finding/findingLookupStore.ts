import { create } from "zustand";
import type { Finding } from "./finding.types";

interface FindingLookupEntry {
  title: string;
  displayId: string | null;
}

interface FindingLookupState {
  projectId: string | null;
  findingsById: Record<string, FindingLookupEntry>;
  setLookup: (projectId: string, findings: Finding[]) => void;
}

export const useFindingLookupStore = create<FindingLookupState>((set) => ({
  projectId: null,
  findingsById: {},
  setLookup: (projectId, findings) =>
    set({
      projectId,
      findingsById: Object.fromEntries(
        findings.map((finding) => [finding.id, { title: finding.title, displayId: finding.displayId }]),
      ),
    }),
}));
