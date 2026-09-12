CREATE TABLE workspace_catalog (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  folder_path     TEXT NOT NULL UNIQUE,
  created_at      TEXT NOT NULL,
  last_opened_at  TEXT,
  is_archived     INTEGER NOT NULL DEFAULT 0,
  data            TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data))
);

CREATE TABLE app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(value))
);
