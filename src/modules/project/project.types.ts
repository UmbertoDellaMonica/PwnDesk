import type { Id, IsoDateTime, JsonValue } from "../../shared/types";

export type ProjectStatus = "active" | "archived" | "closed";

export interface Project {
  id: Id;
  name: string;
  clientName: string | null;
  status: ProjectStatus;
  startsAt: IsoDateTime | null;
  endsAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  schemaVersion: number;
  data: Record<string, JsonValue>;
}

export interface ProjectHandle {
  id: Id;
  name: string;
  slug: string;
  folderPath: string;
}
