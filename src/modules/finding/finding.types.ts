import type { Id, IsoDateTime, JsonValue } from "../../shared/types";

export type FindingStatus =
  | "draft"
  | "validated"
  | "reported"
  | "remediated"
  | "retested"
  | "closed";

export type FindingSeverity = "none" | "low" | "medium" | "high" | "critical";

export interface FindingData {
  category?: string;
  description?: string;
  rootCause?: string;
  impact?: string;
  reproduction?: string;
  remediation?: string;
  references?: string;
  /** evidenceId -> caption text, e.g. "Figure 1: verbose stack trace on /api/error" */
  evidenceCaptions?: Record<string, string>;
  [key: string]: JsonValue | undefined;
}

export interface Finding {
  id: Id;
  displayId: string | null;
  title: string;
  status: FindingStatus;
  severity: FindingSeverity | null;
  cvssVector: string | null;
  cvssScore: number | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  data: FindingData;
}

export type AssetType = "host" | "url" | "api" | "credential" | "other";

export interface Asset {
  id: Id;
  name: string;
  assetType: AssetType;
  createdAt: IsoDateTime;
  data: Record<string, JsonValue>;
}
