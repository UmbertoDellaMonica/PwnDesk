import { appDataDir, join } from "@tauri-apps/api/path";

let cachedAppDataDir: string | null = null;

async function getAppDataDir(): Promise<string> {
  if (!cachedAppDataDir) {
    cachedAppDataDir = await appDataDir();
  }
  return cachedAppDataDir;
}

export async function getCatalogDbPath(): Promise<string> {
  return join(await getAppDataDir(), "catalog.sqlite");
}

export async function getSettingsPath(): Promise<string> {
  return join(await getAppDataDir(), "settings.json");
}

export async function getProjectsRootDir(): Promise<string> {
  return join(await getAppDataDir(), "projects");
}

export async function getProjectDir(folderName: string): Promise<string> {
  return join(await getProjectsRootDir(), folderName);
}

export async function getProjectDbPath(folderName: string): Promise<string> {
  return join(await getProjectDir(folderName), "project.sqlite");
}

export async function getEvidenceDir(folderName: string): Promise<string> {
  return join(await getProjectDir(folderName), "evidence");
}
