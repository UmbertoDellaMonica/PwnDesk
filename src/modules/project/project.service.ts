import { openProjectDb } from "../../db/client";
import { ensureDir, pathExists, removePath } from "../../platform/fs";
import { getEvidenceDir, getProjectDbPath, getProjectDir } from "../../platform/paths";
import { newId } from "../../shared/lib/id";
import { slugify } from "../../shared/lib/slug";
import {
  registerProject,
  removeFromCatalog,
  touchLastOpened,
} from "../workspace/catalog";
import type { CatalogEntry } from "../workspace/workspace.types";
import type { MethodologyId } from "./methodology";
import { bootstrapProjectPages } from "./project.bootstrap";
import { getProjectRow, insertProjectRow, migrateProjectDb } from "./project.repository";
import type { Project } from "./project.types";

async function uniqueFolderName(id: string, name: string): Promise<string> {
  const slug = slugify(name);
  const suffix = id.slice(-6).toLowerCase();
  return `${slug}-${suffix}`;
}

export async function createProject(input: {
  name: string;
  clientName?: string;
  methodologyId: MethodologyId;
}): Promise<{ entry: CatalogEntry; firstPageId: string }> {
  const id = newId();
  const folderName = await uniqueFolderName(id, input.name);
  const projectDir = await getProjectDir(folderName);

  if (await pathExists(projectDir)) {
    throw new Error(`Project folder already exists: ${projectDir}`);
  }

  try {
    await ensureDir(projectDir);
    await ensureDir(await getEvidenceDir(folderName));

    const dbPath = await getProjectDbPath(folderName);
    const db = await openProjectDb(dbPath);
    await migrateProjectDb(db);
    await insertProjectRow(db, {
      id,
      name: input.name,
      clientName: input.clientName,
      data: { methodologyId: input.methodologyId },
    });
    const { firstPageId } = await bootstrapProjectPages(db, id, input.methodologyId);

    const entry = await registerProject({
      id,
      name: input.name,
      slug: folderName,
      folderPath: projectDir,
    });
    await touchLastOpened(id);
    return { entry: { ...entry, lastOpenedAt: entry.createdAt }, firstPageId };
  } catch (error) {
    await removePath(projectDir).catch(() => undefined);
    throw error;
  }
}

export async function openProject(
  entry: CatalogEntry,
): Promise<{ project: Project | null }> {
  const dbPath = `${entry.folderPath}/project.sqlite`;
  const db = await openProjectDb(dbPath);
  await migrateProjectDb(db);
  await touchLastOpened(entry.id);
  return { project: await getProjectRow(db) };
}

export async function deleteProject(entry: CatalogEntry): Promise<void> {
  // Remove from the catalog first so the project disappears from the UI
  // immediately, regardless of what happens below — background queries from
  // still-mounted components (evidence/pages/findings) can otherwise race the
  // file/connection cleanup and leave a "ghost" entry the user can't get rid
  // of even though it's what they actually care about being gone.
  await removeFromCatalog(entry.id);

  // Deliberately NOT calling closeDb() here: explicitly closing this
  // project's pooled connection has been observed to corrupt the SQL
  // plugin's connection pool for *unrelated* databases too (including
  // creating an entirely new project afterward) in this Tauri SQL plugin
  // version. Leaving the connection open means Windows will likely keep the
  // underlying file locked, so the folder below often won't actually be
  // removable until the app restarts — an orphaned folder on disk is a far
  // smaller problem than breaking project creation/opening app-wide.
  await removePath(entry.folderPath).catch((error) => {
    console.error(`Project removed, but its files at ${entry.folderPath} could not be fully cleaned up`, error);
  });
}
