import type Database from "@tauri-apps/plugin-sql";
import { newId } from "../../shared/lib/id";
import type { Asset, Finding, FindingData, FindingSeverity, FindingStatus } from "./finding.types";

interface FindingSummaryRow {
  id: string;
  display_id: string | null;
  title: string;
}

interface FindingRow {
  id: string;
  display_id: string | null;
  title: string;
  status: string;
  severity: string | null;
  cvss_vector: string | null;
  cvss_score: number | null;
  created_at: string;
  updated_at: string;
  data: string;
}

interface AssetRow {
  id: string;
  name: string;
  asset_type: string;
  created_at: string;
  data: string;
}

function toFinding(row: FindingRow): Finding {
  return {
    id: row.id,
    displayId: row.display_id,
    title: row.title,
    status: row.status as FindingStatus,
    severity: row.severity as FindingSeverity | null,
    cvssVector: row.cvss_vector,
    cvssScore: row.cvss_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data: JSON.parse(row.data),
  };
}

function toAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    assetType: row.asset_type as Asset["assetType"],
    createdAt: row.created_at,
    data: JSON.parse(row.data),
  };
}

export async function listFindings(db: Database): Promise<Finding[]> {
  const rows = await db.select<FindingRow[]>(
    "SELECT * FROM finding ORDER BY created_at DESC",
  );
  return rows.map(toFinding);
}

export async function getFinding(db: Database, id: string): Promise<Finding | null> {
  const rows = await db.select<FindingRow[]>("SELECT * FROM finding WHERE id = $1", [id]);
  return rows.length > 0 ? toFinding(rows[0]) : null;
}

const DISPLAY_ID_PREFIX = "FIND-";

/**
 * Next sequential display ID (FIND-001, FIND-002, ...), derived from the
 * highest existing numeric suffix rather than a row count, so it stays
 * stable and gap-free even if findings in between have been deleted.
 */
async function nextDisplayId(db: Database): Promise<string> {
  const rows = await db.select<{ display_id: string | null }[]>(
    "SELECT display_id FROM finding WHERE display_id LIKE $1",
    [`${DISPLAY_ID_PREFIX}%`],
  );
  const maxN = rows.reduce((max, row) => {
    const n = Number(row.display_id?.slice(DISPLAY_ID_PREFIX.length));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `${DISPLAY_ID_PREFIX}${String(maxN + 1).padStart(3, "0")}`;
}

export async function createFinding(
  db: Database,
  input: { title: string; displayId?: string | null },
): Promise<Finding> {
  const id = newId();
  const now = new Date().toISOString();
  const displayId = input.displayId ?? (await nextDisplayId(db));
  await db.execute(
    "INSERT INTO finding (id, display_id, title, status, severity, cvss_vector, cvss_score, created_at, updated_at, data) VALUES ($1, $2, $3, 'draft', NULL, NULL, NULL, $4, $4, '{}')",
    [id, displayId, input.title, now],
  );
  return {
    id,
    displayId,
    title: input.title,
    status: "draft",
    severity: null,
    cvssVector: null,
    cvssScore: null,
    createdAt: now,
    updatedAt: now,
    data: {},
  };
}

export async function updateFinding(
  db: Database,
  id: string,
  patch: Partial<{
    title: string;
    status: FindingStatus;
    severity: FindingSeverity | null;
    cvssVector: string | null;
    cvssScore: number | null;
    data: FindingData;
  }>,
): Promise<void> {
  const current = await getFinding(db, id);
  if (!current) throw new Error("Finding not found");

  const next = {
    title: patch.title ?? current.title,
    status: patch.status ?? current.status,
    severity: patch.severity !== undefined ? patch.severity : current.severity,
    cvssVector: patch.cvssVector !== undefined ? patch.cvssVector : current.cvssVector,
    cvssScore: patch.cvssScore !== undefined ? patch.cvssScore : current.cvssScore,
    data: patch.data ?? current.data,
  };

  await db.execute(
    "UPDATE finding SET title = $1, status = $2, severity = $3, cvss_vector = $4, cvss_score = $5, data = $6, updated_at = $7 WHERE id = $8",
    [
      next.title,
      next.status,
      next.severity,
      next.cvssVector,
      next.cvssScore,
      JSON.stringify(next.data),
      new Date().toISOString(),
      id,
    ],
  );
}

export async function deleteFinding(db: Database, id: string): Promise<void> {
  await db.execute("DELETE FROM finding WHERE id = $1", [id]);
}

/**
 * Creates a draft finding pre-filled from an evidence classification suggestion
 * (test-case -> presumed vulnerability) and links the source evidence to it.
 */
export async function createFindingFromEvidence(
  db: Database,
  input: { title: string; category: string; reproductionHint: string; evidenceId: string },
): Promise<Finding> {
  const finding = await createFinding(db, { title: input.title });
  await updateFinding(db, finding.id, {
    data: { category: input.category, reproduction: input.reproductionHint },
  });
  await linkEvidence(db, finding.id, input.evidenceId);
  return getFinding(db, finding.id) as Promise<Finding>;
}

/**
 * Promotes an inline Vulnerability Note (written while taking notes on a
 * page) into a structured Finding — the Finding becomes the source of truth
 * for this vulnerability from here on; the note just links to it.
 */
export async function promoteVulnNoteToFinding(
  db: Database,
  input: {
    title: string;
    description: string;
    reproduction: string;
    category: string;
    cvssVector: string | null;
    cvssScore: number | null;
    severity: FindingSeverity | null;
    evidenceIds: string[];
    evidenceCaptions: Record<string, string>;
  },
): Promise<Finding> {
  const finding = await createFinding(db, { title: input.title });
  await updateFinding(db, finding.id, {
    cvssVector: input.cvssVector,
    cvssScore: input.cvssScore,
    severity: input.severity,
    data: {
      description: input.description,
      reproduction: input.reproduction,
      category: input.category,
      evidenceCaptions: input.evidenceCaptions,
    },
  });
  for (const evidenceId of input.evidenceIds) {
    await linkEvidence(db, finding.id, evidenceId);
  }
  return getFinding(db, finding.id) as Promise<Finding>;
}

export async function listFindingsForEvidence(
  db: Database,
  evidenceId: string,
): Promise<{ id: string; displayId: string | null; title: string }[]> {
  const rows = await db.select<FindingSummaryRow[]>(
    `SELECT finding.id, finding.display_id, finding.title
     FROM finding
     JOIN finding_evidence ON finding_evidence.finding_id = finding.id
     WHERE finding_evidence.evidence_id = $1
     ORDER BY finding.title ASC`,
    [evidenceId],
  );
  return rows.map((row) => ({ id: row.id, displayId: row.display_id, title: row.title }));
}

/** All finding<->evidence links in the project, for building the graph view without N per-finding queries. */
export async function listAllFindingEvidenceLinks(
  db: Database,
): Promise<{ findingId: string; evidenceId: string }[]> {
  const rows = await db.select<{ finding_id: string; evidence_id: string }[]>(
    "SELECT finding_id, evidence_id FROM finding_evidence",
  );
  return rows.map((row) => ({ findingId: row.finding_id, evidenceId: row.evidence_id }));
}

/** All finding<->asset links in the project, for building the graph view without N per-finding queries. */
export async function listAllFindingAssetLinks(
  db: Database,
): Promise<{ findingId: string; assetId: string }[]> {
  const rows = await db.select<{ finding_id: string; asset_id: string }[]>(
    "SELECT finding_id, asset_id FROM finding_asset",
  );
  return rows.map((row) => ({ findingId: row.finding_id, assetId: row.asset_id }));
}

export async function listEvidenceIdsForFinding(
  db: Database,
  findingId: string,
): Promise<string[]> {
  const rows = await db.select<{ evidence_id: string }[]>(
    "SELECT evidence_id FROM finding_evidence WHERE finding_id = $1",
    [findingId],
  );
  return rows.map((row) => row.evidence_id);
}

export async function linkEvidence(
  db: Database,
  findingId: string,
  evidenceId: string,
): Promise<void> {
  await db.execute(
    "INSERT OR IGNORE INTO finding_evidence (finding_id, evidence_id) VALUES ($1, $2)",
    [findingId, evidenceId],
  );
}

export async function unlinkEvidence(
  db: Database,
  findingId: string,
  evidenceId: string,
): Promise<void> {
  await db.execute(
    "DELETE FROM finding_evidence WHERE finding_id = $1 AND evidence_id = $2",
    [findingId, evidenceId],
  );
}

export async function listAssets(db: Database): Promise<Asset[]> {
  const rows = await db.select<AssetRow[]>("SELECT * FROM asset ORDER BY name ASC");
  return rows.map(toAsset);
}

export async function getAsset(db: Database, id: string): Promise<Asset | null> {
  const rows = await db.select<AssetRow[]>("SELECT * FROM asset WHERE id = $1", [id]);
  return rows.length > 0 ? toAsset(rows[0]) : null;
}

export async function updateAsset(
  db: Database,
  id: string,
  patch: { name?: string; assetType?: Asset["assetType"] },
): Promise<void> {
  const current = await getAsset(db, id);
  if (!current) throw new Error("Asset not found");
  await db.execute("UPDATE asset SET name = $1, asset_type = $2 WHERE id = $3", [
    patch.name ?? current.name,
    patch.assetType ?? current.assetType,
    id,
  ]);
}

export async function deleteAsset(db: Database, id: string): Promise<void> {
  // finding_asset rows cascade on delete (ON DELETE CASCADE), so no manual unlink needed.
  await db.execute("DELETE FROM asset WHERE id = $1", [id]);
}

export async function listFindingsForAsset(
  db: Database,
  assetId: string,
): Promise<{ id: string; displayId: string | null; title: string; severity: FindingSeverity | null }[]> {
  const rows = await db.select<
    { id: string; display_id: string | null; title: string; severity: string | null }[]
  >(
    `SELECT finding.id, finding.display_id, finding.title, finding.severity
     FROM finding
     JOIN finding_asset ON finding_asset.finding_id = finding.id
     WHERE finding_asset.asset_id = $1
     ORDER BY finding.title ASC`,
    [assetId],
  );
  return rows.map((row) => ({
    id: row.id,
    displayId: row.display_id,
    title: row.title,
    severity: row.severity as FindingSeverity | null,
  }));
}

export async function findOrCreateAsset(
  db: Database,
  name: string,
  assetType: Asset["assetType"],
): Promise<Asset> {
  const existing = await db.select<AssetRow[]>(
    "SELECT * FROM asset WHERE name = $1 AND asset_type = $2",
    [name, assetType],
  );
  if (existing.length > 0) return toAsset(existing[0]);

  const id = newId();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO asset (id, name, asset_type, created_at, data) VALUES ($1, $2, $3, $4, '{}')",
    [id, name, assetType, now],
  );
  return { id, name, assetType, createdAt: now, data: {} };
}

export async function listAssetsForFinding(db: Database, findingId: string): Promise<Asset[]> {
  const rows = await db.select<AssetRow[]>(
    `SELECT asset.* FROM asset
     JOIN finding_asset ON finding_asset.asset_id = asset.id
     WHERE finding_asset.finding_id = $1
     ORDER BY asset.name ASC`,
    [findingId],
  );
  return rows.map(toAsset);
}

export async function linkAsset(db: Database, findingId: string, assetId: string): Promise<void> {
  await db.execute(
    "INSERT OR IGNORE INTO finding_asset (finding_id, asset_id) VALUES ($1, $2)",
    [findingId, assetId],
  );
}

export async function unlinkAsset(
  db: Database,
  findingId: string,
  assetId: string,
): Promise<void> {
  await db.execute(
    "DELETE FROM finding_asset WHERE finding_id = $1 AND asset_id = $2",
    [findingId, assetId],
  );
}
