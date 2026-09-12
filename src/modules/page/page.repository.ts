import type Database from "@tauri-apps/plugin-sql";
import { newId } from "../../shared/lib/id";
import type { JsonValue } from "../../shared/types";
import type { Page } from "./page.types";

interface PageRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  order_key: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  blocks: string;
  data: string;
}

function toPage(row: PageRow): Page {
  return {
    id: row.id,
    projectId: row.project_id,
    parentId: row.parent_id,
    title: row.title,
    orderKey: row.order_key,
    isDeleted: row.is_deleted === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    blocks: JSON.parse(row.blocks),
    data: JSON.parse(row.data),
  };
}

export async function listPages(db: Database, projectId: string): Promise<Page[]> {
  const rows = await db.select<PageRow[]>(
    "SELECT * FROM page WHERE project_id = $1 AND is_deleted = 0 ORDER BY order_key ASC, created_at ASC",
    [projectId],
  );
  return rows.map(toPage);
}

export async function getPage(db: Database, pageId: string): Promise<Page | null> {
  const rows = await db.select<PageRow[]>("SELECT * FROM page WHERE id = $1", [pageId]);
  return rows.length > 0 ? toPage(rows[0]) : null;
}

export async function createPage(
  db: Database,
  projectId: string,
  title = "Untitled",
  parentId: string | null = null,
): Promise<Page> {
  const id = newId();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO page (id, project_id, parent_id, title, order_key, is_deleted, created_at, updated_at, blocks, data) VALUES ($1, $2, $3, $4, $5, 0, $5, $5, '{}', '{}')",
    [id, projectId, parentId, title, now],
  );
  return {
    id,
    projectId,
    parentId,
    title,
    orderKey: now,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    blocks: {},
    data: {},
  };
}

export async function updatePageTitle(
  db: Database,
  pageId: string,
  title: string,
): Promise<void> {
  await db.execute("UPDATE page SET title = $1, updated_at = $2 WHERE id = $3", [
    title,
    new Date().toISOString(),
    pageId,
  ]);
}

export async function updatePageBlocks(
  db: Database,
  pageId: string,
  blocks: JsonValue,
): Promise<void> {
  await db.execute("UPDATE page SET blocks = $1, updated_at = $2 WHERE id = $3", [
    JSON.stringify(blocks),
    new Date().toISOString(),
    pageId,
  ]);
}

export async function updatePageData(
  db: Database,
  pageId: string,
  data: Record<string, JsonValue>,
): Promise<void> {
  await db.execute("UPDATE page SET data = $1, updated_at = $2 WHERE id = $3", [
    JSON.stringify(data),
    new Date().toISOString(),
    pageId,
  ]);
}

export async function updatePageOrder(
  db: Database,
  pageId: string,
  parentId: string | null,
  orderKey: string,
): Promise<void> {
  await db.execute(
    "UPDATE page SET parent_id = $1, order_key = $2, updated_at = $3 WHERE id = $4",
    [parentId, orderKey, new Date().toISOString(), pageId],
  );
}

export async function softDeletePage(db: Database, pageId: string): Promise<void> {
  await db.execute("UPDATE page SET is_deleted = 1, updated_at = $1 WHERE id = $2", [
    new Date().toISOString(),
    pageId,
  ]);
}
