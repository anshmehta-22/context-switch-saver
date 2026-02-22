-- Context Switch Saver — SQLite Schema
-- Auto-applied on server startup via db.js

CREATE TABLE IF NOT EXISTS snapshots (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  notes      TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK(status IN ('active', 'paused', 'complete')),
  urls       TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  files      TEXT NOT NULL DEFAULT '[]',   -- JSON array of {path, line, col}
  tags       TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snapshots_status  ON snapshots(status);
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON snapshots(created_at DESC);