import type { Id, IsoDateTime, JsonValue } from "../../shared/types";

export interface Page {
  id: Id;
  projectId: Id;
  parentId: Id | null;
  title: string;
  orderKey: string;
  isDeleted: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  blocks: JsonValue;
  data: Record<string, JsonValue>;
}
