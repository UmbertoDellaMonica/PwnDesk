import { join } from "@tauri-apps/api/path";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

export function extensionForMime(mimeType: string): string {
  return MIME_TO_EXT[mimeType] ?? "bin";
}

export async function getEvidenceShardDir(
  evidenceDir: string,
  sha256: string,
): Promise<string> {
  return join(evidenceDir, sha256.slice(0, 2));
}

export async function getEvidenceFilePath(
  evidenceDir: string,
  sha256: string,
  mimeType: string,
): Promise<string> {
  const shardDir = await getEvidenceShardDir(evidenceDir, sha256);
  return join(shardDir, `${sha256}.${extensionForMime(mimeType)}`);
}
