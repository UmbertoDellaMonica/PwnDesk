import type Database from "@tauri-apps/plugin-sql";
import { applyMigrations } from "../../db/migrationRunner";
import type { JsonValue } from "../../shared/types";
import type { Project } from "./project.types";

import initProjectSql from "../../db/migrations/project/0001_init_project.sql?raw";

interface ProjectRow {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  schema_version: number;
  data: string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    status: row.status as Project["status"],
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    data: JSON.parse(row.data),
  };
}

export async function migrateProjectDb(db: Database): Promise<void> {
  await applyMigrations(db, [{ version: 1, sql: initProjectSql }]);
}

export async function insertProjectRow(
  db: Database,
  project: {
    id: string;
    name: string;
    clientName?: string | null;
    data?: Record<string, JsonValue>;
  },
): Promise<Project> {
  const now = new Date().toISOString();
  const data = project.data ?? {};
  await db.execute(
    "INSERT INTO project (id, name, client_name, status, created_at, updated_at, schema_version, data) VALUES ($1, $2, $3, 'active', $4, $4, 1, $5)",
    [project.id, project.name, project.clientName ?? null, now, JSON.stringify(data)],
  );
  return {
    id: project.id,
    name: project.name,
    clientName: project.clientName ?? null,
    status: "active",
    startsAt: null,
    endsAt: null,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    data,
  };
}

export async function getProjectRow(db: Database): Promise<Project | null> {
  const rows = await db.select<ProjectRow[]>("SELECT * FROM project LIMIT 1");
  return rows.length > 0 ? toProject(rows[0]) : null;
}
