import type Database from "@tauri-apps/plugin-sql";
import { ensureDir, readBinaryFile, writeBinaryFile } from "../../platform/fs";
import { getEvidenceBySha256, insertEvidence } from "./evidence.repository";
import { getEvidenceFilePath, getEvidenceShardDir } from "./evidence.paths";
import type { Evidence } from "./evidence.types";

export async function sha256Hex(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function storeAndInsert(
  db: Database,
  evidenceDir: string,
  blob: Blob,
  originalName: string | null,
  derivedFromId: string | null,
): Promise<Evidence> {
  const sha256 = await sha256Hex(blob);

  const existing = await getEvidenceBySha256(db, sha256);
  if (existing) return existing;

  const mimeType = blob.type || "application/octet-stream";
  const bytes = new Uint8Array(await blob.arrayBuffer());

  await ensureDir(await getEvidenceShardDir(evidenceDir, sha256));
  const filePath = await getEvidenceFilePath(evidenceDir, sha256, mimeType);
  await writeBinaryFile(filePath, bytes);

  return insertEvidence(db, {
    sha256,
    mimeType,
    byteSize: bytes.byteLength,
    originalName,
    derivedFromId,
    capturedAt: new Date().toISOString(),
  });
}

export async function captureEvidence(
  db: Database,
  evidenceDir: string,
  file: Blob & { name?: string },
): Promise<Evidence> {
  return storeAndInsert(db, evidenceDir, file, file.name ?? null, null);
}

/**
 * Saves a transformed (redacted, cropped, ...) copy of an image as a brand
 * new evidence row linked back to the source via derivedFromId — the
 * immutable-evidence rule means the original file/row is never edited.
 */
export async function deriveEvidence(
  db: Database,
  evidenceDir: string,
  blob: Blob,
  originalName: string | null,
  derivedFromId: string,
): Promise<Evidence> {
  return storeAndInsert(db, evidenceDir, blob, originalName, derivedFromId);
}

export async function readEvidenceBlob(
  evidenceDir: string,
  evidence: Pick<Evidence, "sha256" | "mimeType">,
): Promise<Blob> {
  const filePath = await getEvidenceFilePath(evidenceDir, evidence.sha256, evidence.mimeType);
  const bytes = await readBinaryFile(filePath);
  return new Blob([bytes as unknown as BlobPart], { type: evidence.mimeType });
}
