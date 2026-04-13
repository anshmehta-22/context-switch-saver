-- Context Switch Saver — SQLite Schema
-- Auto-applied on server startup via db.js

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshots (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  notes      TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK(status IN ('active', 'paused', 'complete')),
  urls       TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  attachments TEXT NOT NULL DEFAULT '[]',  -- JSON array of screenshot objects
  files      TEXT NOT NULL DEFAULT '[]',   -- JSON array of {path, line, col}
  tags       TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  pause_time TEXT DEFAULT NULL,           -- ISO timestamp when snapshot was paused
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snapshots_status  ON snapshots(status);
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON snapshots(created_at DESC);