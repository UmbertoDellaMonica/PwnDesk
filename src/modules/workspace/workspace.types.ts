import type { Id, IsoDateTime, JsonValue } from "../../shared/types";

export interface CatalogEntry {
  id: Id;
  name: string;
  slug: string;
  folderPath: string;
  createdAt: IsoDateTime;
  lastOpenedAt: IsoDateTime | null;
  isArchived: boolean;
  data: Record<string, JsonValue>;
}
