import { exists, mkdir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";

export async function pathExists(path: string): Promise<boolean> {
  // The fs plugin's exists() throws instead of resolving false when the
  // path (or one of its parent segments) doesn't exist yet, e.g. a brand
  // new project folder that hasn't been created — treat any stat failure
  // here as "doesn't exist".
  try {
    return await exists(path);
  } catch {
    return false;
  }
}

export async function ensureDir(path: string): Promise<void> {
  if (!(await pathExists(path))) {
    await mkdir(path, { recursive: true });
  }
}

export async function removePath(path: string): Promise<void> {
  try {
    await remove(path, { recursive: true });
  } catch (error) {
    // Recursive removal can legitimately race with a concurrent reader that
    // already stat'd a child path away mid-deletion — a "not found" error
    // here means the end state we wanted (path gone) was already reached.
    const message = error instanceof Error ? error.message : String(error);
    if (/os error 2|cannot find|not found/i.test(message)) return;
    throw error;
  }
}

export async function writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
  await writeFile(path, data);
}

export async function readBinaryFile(path: string): Promise<Uint8Array> {
  return readFile(path);
}
