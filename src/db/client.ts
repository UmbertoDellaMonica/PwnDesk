import Database from "@tauri-apps/plugin-sql";

function toSqliteUrl(absolutePath: string): string {
  return `sqlite:${absolutePath.replace(/\\/g, "/")}`;
}

const openDbs = new Map<string, Promise<Database>>();

export async function openDb(absolutePath: string): Promise<Database> {
  const url = toSqliteUrl(absolutePath);
  let dbPromise = openDbs.get(url);
  if (!dbPromise) {
    dbPromise = Database.load(url).then(async (db) => {
      // Without this, concurrent writes from independent mutations (e.g. a
      // page's blocks save and its link sync firing back-to-back) can hit
      // SQLITE_BUSY ("database is locked") instead of queueing, since SQLite
      // only allows one writer at a time. This makes SQLite wait/retry
      // internally instead of failing immediately.
      await db.execute("PRAGMA busy_timeout = 5000");
      return db;
    });
    openDbs.set(url, dbPromise);
  }
  return dbPromise;
}

let catalogDbPromise: Promise<Database> | null = null;

export async function getCatalogDb(catalogPath: string): Promise<Database> {
  if (!catalogDbPromise) {
    catalogDbPromise = openDb(catalogPath);
  }
  return catalogDbPromise;
}

export async function openProjectDb(projectDbPath: string): Promise<Database> {
  return openDb(projectDbPath);
}
