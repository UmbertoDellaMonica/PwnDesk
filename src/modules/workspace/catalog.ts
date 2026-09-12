import type Database from "@tauri-apps/plugin-sql";
import { getCatalogDb } from "../../db/client";
import { applyMigrations } from "../../db/migrationRunner";
import { ensureDir } from "../../platform/fs";
import { getCatalogDbPath } from "../../platform/paths";
import { newId } from "../../shared/lib/id";
import type { JsonValue } from "../../shared/types";
import type { CatalogEntry } from "./workspace.types";

import initCatalogSql from "../../db/migrations/global/0001_init_catalog.sql?raw";

interface CatalogRow {
  id: string;
  name: string;
  slug: string;
  folder_path: string;
  created_at: string;
  last_opened_at: string | null;
  is_archived: number;
  data: string;
}

function toEntry(row: CatalogRow): CatalogEntry {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    folderPath: row.folder_path,
    createdAt: row.created_at,
    lastOpenedAt: row.last_opened_at,
    isArchived: row.is_archived === 1,
    data: JSON.parse(row.data) as Record<string, JsonValue>,
  };
}

let dbPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const path = await getCatalogDbPath();
      const dir = path.slice(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")));
      await ensureDir(dir);
      const db = await getCatalogDb(path);
      await applyMigrations(db, [{ version: 1, sql: initCatalogSql }]);
      return db;
    })();
  }
  return dbPromise;
}

export async function listProjects(): Promise<CatalogEntry[]> {
  const db = await getDb();
  const rows = await db.select<CatalogRow[]>(
    "SELECT * FROM workspace_catalog WHERE is_archived = 0 ORDER BY last_opened_at DESC, created_at DESC",
  );
  return rows.map(toEntry);
}

export async function registerProject(entry: {
  id?: string;
  name: string;
  slug: string;
  folderPath: string;
}): Promise<CatalogEntry> {
  const db = await getDb();
  const id = entry.id ?? newId();
  const createdAt = new Date().toISOString();
  await db.execute(
    "INSERT INTO workspace_catalog (id, name, slug, folder_path, created_at, last_opened_at, is_archived, data) VALUES ($1, $2, $3, $4, $5, NULL, 0, '{}')",
    [id, entry.name, entry.slug, entry.folderPath, createdAt],
  );
  return {
    id,
    name: entry.name,
    slug: entry.slug,
    folderPath: entry.folderPath,
    createdAt,
    lastOpenedAt: null,
    isArchived: false,
    data: {},
  };
}

export async function touchLastOpened(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE workspace_catalog SET last_opened_at = $1 WHERE id = $2", [
    new Date().toISOString(),
    id,
  ]);
}

export async function removeFromCatalog(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM workspace_catalog WHERE id = $1", [id]);
}
