import type { CatalogEntry } from "../workspace/workspace.types";
import { useEvidenceList } from "./useEvidence";

/** Client-side filter over the same evidence list the generic gallery uses — screenshots are just evidence tagged data.category === "screenshot", not a separate table, so they stay visible in both views. */
export function useScreenshotList(entry: CatalogEntry | null) {
  const query = useEvidenceList(entry);
  return {
    ...query,
    data: query.data?.filter((item) => item.data.category === "screenshot"),
  };
}
