import { create } from "zustand";
import type { CatalogEntry } from "../workspace/workspace.types";
import type { Evidence } from "./evidence.types";

interface EvidenceLookupEntry {
  originalName: string | null;
  mimeType: string;
  sha256: string;
  isDeleted: boolean;
}

interface EvidenceLookupState {
  activeEntry: CatalogEntry | null;
  evidenceById: Record<string, EvidenceLookupEntry>;
  setLookup: (entry: CatalogEntry, evidence: Evidence[]) => void;
}

export const useEvidenceLookupStore = create<EvidenceLookupState>((set) => ({
  activeEntry: null,
  evidenceById: {},
  setLookup: (entry, evidence) =>
    set({
      activeEntry: entry,
      evidenceById: Object.fromEntries(
        evidence.map((item) => [
          item.id,
          {
            originalName: item.originalName,
            mimeType: item.mimeType,
            sha256: item.sha256,
            isDeleted: item.isDeleted,
          },
        ]),
      ),
    }),
}));
