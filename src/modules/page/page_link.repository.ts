import type Database from "@tauri-apps/plugin-sql";
import { newId } from "../../shared/lib/id";

export interface LinkTarget {
  targetType: string;
  targetId: string;
}

export interface Backlink {
  pageId: string;
  pageTitle: string;
}

export async function replaceOutgoingLinks(
  db: Database,
  sourcePageId: string,
  targets: LinkTarget[],
): Promise<void> {
  // Deliberately not wrapped in an explicit BEGIN/COMMIT: @tauri-apps/plugin-sql
  // does not guarantee consecutive db.execute() calls reuse the same pooled
  // connection, so a manual multi-statement transaction here is not reliable
  // (COMMIT/ROLLBACK can silently fail against a different connection than
  // the one that started it). The link set per page is small, so plain
  // sequential statements are simpler and correct in practice.
  await db.execute("DELETE FROM page_link WHERE source_page_id = $1", [sourcePageId]);
  const now = new Date().toISOString();
  for (const target of targets) {
    await db.execute(
      "INSERT INTO page_link (id, source_page_id, target_type, target_id, created_at) VALUES ($1, $2, $3, $4, $5)",
      [newId(), sourcePageId, target.targetType, target.targetId, now],
    );
  }
}

export async function listBacklinksForPage(
  db: Database,
  pageId: string,
): Promise<Backlink[]> {
  const rows = await db.select<{ id: string; title: string }[]>(
    `SELECT DISTINCT p.id, p.title
     FROM page_link pl
     JOIN page p ON p.id = pl.source_page_id
     WHERE pl.target_type = 'page' AND pl.target_id = $1 AND p.is_deleted = 0
     ORDER BY p.title ASC`,
    [pageId],
  );
  return rows.map((row) => ({ pageId: row.id, pageTitle: row.title }));
}
