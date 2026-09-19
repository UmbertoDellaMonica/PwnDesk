import type Database from "@tauri-apps/plugin-sql";
import { newId } from "../../shared/lib/id";
import type { JsonValue } from "../../shared/types";
import type { Evidence } from "./evidence.types";

interface EvidenceRow {
  id: string;
  sha256: string;
  mime_type: string;
  byte_size: number;
  original_name: string | null;
  derived_from_id: string | null;
  captured_at: string;
  created_at: string;
  is_deleted: number;
  data: string;
}

function toEvidence(row: EvidenceRow): Evidence {
  return {
    id: row.id,
    sha256: row.sha256,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    originalName: row.original_name,
    derivedFromId: row.derived_from_id,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    isDeleted: row.is_deleted === 1,
    data: JSON.parse(row.data),
  };
}

export async function listEvidence(db: Database): Promise<Evidence[]> {
  const rows = await db.select<EvidenceRow[]>(
    "SELECT * FROM evidence WHERE is_deleted = 0 ORDER BY created_at DESC",
  );
  return rows.map(toEvidence);
}

export async function getEvidenceById(db: Database, id: string): Promise<Evidence | null> {
  const rows = await db.select<EvidenceRow[]>("SELECT * FROM evidence WHERE id = $1", [id]);
  return rows.length > 0 ? toEvidence(rows[0]) : null;
}

export async function getEvidenceBySha256(
  db: Database,
  sha256: string,
): Promise<Evidence | null> {
  const rows = await db.select<EvidenceRow[]>(
    "SELECT * FROM evidence WHERE sha256 = $1",
    [sha256],
  );
  return rows.length > 0 ? toEvidence(rows[0]) : null;
}

export async function insertEvidence(
  db: Database,
  input: {
    sha256: string;
    mimeType: string;
    byteSize: number;
    originalName: string | null;
    derivedFromId: string | null;
    capturedAt: string;
    data?: Record<string, JsonValue>;
  },
): Promise<Evidence> {
  const id = newId();
  const now = new Date().toISOString();
  const data = input.data ?? {};
  await db.execute(
    `INSERT INTO evidence
      (id, sha256, mime_type, byte_size, original_name, derived_from_id, captured_at, created_at, is_deleted, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9)`,
    [
      id,
      input.sha256,
      input.mimeType,
      input.byteSize,
      input.originalName,
      input.derivedFromId,
      input.capturedAt,
      now,
      JSON.stringify(data),
    ],
  );
  return {
    id,
    sha256: input.sha256,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    originalName: input.originalName,
    derivedFromId: input.derivedFromId,
    capturedAt: input.capturedAt,
    createdAt: now,
    isDeleted: false,
    data,
  };
}

export async function listDerivedEvidence(db: Database, evidenceId: string): Promise<Evidence[]> {
  const rows = await db.select<EvidenceRow[]>(
    "SELECT * FROM evidence WHERE derived_from_id = $1 AND is_deleted = 0 ORDER BY created_at DESC",
    [evidenceId],
  );
  return rows.map(toEvidence);
}

export async function softDeleteEvidence(db: Database, id: string): Promise<void> {
  // Metadata only — the binary file on disk is never deleted (immutable evidence rule).
  await db.execute("UPDATE evidence SET is_deleted = 1 WHERE id = $1", [id]);
}

export async function updateEvidenceData(
  db: Database,
  id: string,
  data: Record<string, JsonValue>,
): Promise<void> {
  await db.execute("UPDATE evidence SET data = $1 WHERE id = $2", [JSON.stringify(data), id]);
}
