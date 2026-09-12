CREATE TABLE project (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  client_name    TEXT,
  status         TEXT NOT NULL DEFAULT 'active',
  starts_at      TEXT,
  ends_at        TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  data           TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data))
);

CREATE TABLE page (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  parent_id  TEXT REFERENCES page(id) ON DELETE SET NULL,
  title      TEXT NOT NULL DEFAULT 'Untitled',
  order_key  TEXT NOT NULL DEFAULT '',
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  blocks     TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(blocks)),
  data       TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data))
);
CREATE INDEX idx_page_project ON page(project_id);
CREATE INDEX idx_page_parent  ON page(parent_id);

CREATE TABLE page_link (
  id             TEXT PRIMARY KEY,
  source_page_id TEXT NOT NULL REFERENCES page(id) ON DELETE CASCADE,
  target_type    TEXT NOT NULL,
  target_id      TEXT NOT NULL,
  created_at     TEXT NOT NULL
);
CREATE INDEX idx_page_link_source ON page_link(source_page_id);
CREATE INDEX idx_page_link_target ON page_link(target_type, target_id);

CREATE TABLE evidence (
  id              TEXT PRIMARY KEY,
  sha256          TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  byte_size       INTEGER NOT NULL,
  original_name   TEXT,
  derived_from_id TEXT REFERENCES evidence(id) ON DELETE RESTRICT,
  captured_at     TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  data            TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data))
);
CREATE UNIQUE INDEX idx_evidence_sha256 ON evidence(sha256);
CREATE INDEX idx_evidence_derived_from ON evidence(derived_from_id);

CREATE TABLE finding (
  id          TEXT PRIMARY KEY,
  display_id  TEXT,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',
  severity    TEXT,
  cvss_vector TEXT,
  cvss_score  REAL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data))
);

CREATE TABLE finding_evidence (
  finding_id  TEXT NOT NULL REFERENCES finding(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
  PRIMARY KEY (finding_id, evidence_id)
);

CREATE TABLE asset (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data       TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data))
);

CREATE TABLE finding_asset (
  finding_id TEXT NOT NULL REFERENCES finding(id) ON DELETE CASCADE,
  asset_id   TEXT NOT NULL REFERENCES asset(id) ON DELETE CASCADE,
  PRIMARY KEY (finding_id, asset_id)
);
