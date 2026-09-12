import type Database from "@tauri-apps/plugin-sql";

export interface Migration {
  version: number;
  sql: string;
}

function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

export async function applyMigrations(
  db: Database,
  migrations: Migration[],
): Promise<void> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);

  await db.execute(
    "CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)",
  );

  const applied = await db.select<{ version: number }[]>(
    "SELECT version FROM _migrations",
  );
  const appliedVersions = new Set(applied.map((row) => row.version));

  // Not wrapped in an explicit BEGIN/COMMIT: @tauri-apps/plugin-sql does not
  // guarantee consecutive db.execute() calls reuse the same pooled connection,
  // so manual multi-statement transactions are not reliable here (see the
  // same note in page_link.repository.ts, where this was confirmed to
  // silently fail). Migrations already run once, sequentially, before any
  // other query activity, so plain sequential statements are safe.
  for (const migration of sorted) {
    if (appliedVersions.has(migration.version)) continue;

    for (const statement of splitStatements(migration.sql)) {
      await db.execute(statement);
    }
    await db.execute(
      "INSERT INTO _migrations (version, applied_at) VALUES ($1, $2)",
      [migration.version, new Date().toISOString()],
    );
  }
}
