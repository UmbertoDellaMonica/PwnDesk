import type { Id, IsoDateTime, JsonValue } from "../../shared/types";

export interface Evidence {
  id: Id;
  sha256: string;
  mimeType: string;
  byteSize: number;
  originalName: string | null;
  derivedFromId: Id | null;
  capturedAt: IsoDateTime;
  createdAt: IsoDateTime;
  isDeleted: boolean;
  data: Record<string, JsonValue>;
}
