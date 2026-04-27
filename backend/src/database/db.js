// src/db/db.js
// Initialises a shared DB client:
// - Turso via @libsql/client when TURSO_DATABASE_URL is configured
// - local better-sqlite3 fallback when not configured

let Database = null;
try {
  Database = require("better-sqlite3");
} catch {
  // Not installed — production uses Turso instead.
}
// Use the web client to avoid optional native module resolution issues in Node.
const { createClient } = require("@libsql/client");
const path = require("path");
const fs = require("fs");

let defaultDbDir = path.join(process.cwd(), "data");

try {
  // In Electron production builds, persist DB under the OS user data directory.
  const { app } = require("electron");
  if (app && typeof app.getPath === "function") {
    defaultDbDir = app.getPath("userData");
  }
} catch {
  // Not running in Electron; keep local ./data fallback.
}

const dbDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : defaultDbDir;

const dbPath = process.env.DB_PATH ?? path.join(dbDir, "snapshots.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

let _db = null;
let _mode = null;

function hasTursoConfig() {
  const url = (process.env.TURSO_DATABASE_URL || "").trim();
  const token = (process.env.TURSO_AUTH_TOKEN || "").trim();

  if (!url || url === "your_turso_url_here") return false;
  if (!token || token === "your_turso_token_here") return false;

  // Turso URLs are typically libsql://..., but allow http(s) for compatibility.
  if (!/^libsql:\/\//i.test(url) && !/^https?:\/\//i.test(url)) return false;

  return true;
}

function isTursoClient() {
  return _mode === "turso";
}

/**
 * Returns the shared DB instance (lazy-initialised).
 */
function getDb() {
  if (_db) return _db;

  if (hasTursoConfig()) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    _mode = "turso";
    return _db;
  }

  if (Database === null) {
    throw new Error(
      "No valid database configuration found. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, or install better-sqlite3 for local SQLite.",
    );
  }

  fs.mkdirSync(dbDir, { recursive: true });
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL"); // better concurrent read performance
  _db.pragma("foreign_keys = ON");
  _mode = "sqlite";

  return _db;
}

/**
 * Applies schema.sql — idempotent, safe to call on every startup.
 */
async function initDb() {
  const db = getDb();
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");

  if (isTursoClient()) {
    await db.executeMultiple(schema);

    const pragmaResult = await db.execute("PRAGMA table_info(snapshots)");
    const columns = pragmaResult.rows;

    const hasUserId = columns.some((c) => c.name === "user_id");
    if (!hasUserId) {
      await db.execute(
        "ALTER TABLE snapshots ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE",
      );
    }

    // Backfill columns that may not exist in older DBs.
    const hasAttachments = columns.some((c) => c.name === "attachments");
    if (!hasAttachments) {
      await db.execute(
        "ALTER TABLE snapshots ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'",
      );
    }

    const hasPauseTime = columns.some((c) => c.name === "pause_time");
    if (!hasPauseTime) {
      await db.execute(
        "ALTER TABLE snapshots ADD COLUMN pause_time TEXT DEFAULT NULL",
      );
    }

    console.log(`[db] Connected → Turso (${process.env.TURSO_DATABASE_URL})`);
    return;
  }

  db.exec(schema);

  const columns = db.prepare("PRAGMA table_info(snapshots)").all();

  const hasUserId = columns.some((c) => c.name === "user_id");
  if (!hasUserId) {
    db.exec(
      "ALTER TABLE snapshots ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE",
    );
  }

  // Backfill columns that may not exist in older local DB files.
  const hasAttachments = columns.some((c) => c.name === "attachments");
  if (!hasAttachments) {
    db.exec(
      "ALTER TABLE snapshots ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'",
    );
  }

  const hasPauseTime = columns.some((c) => c.name === "pause_time");
  if (!hasPauseTime) {
    db.exec("ALTER TABLE snapshots ADD COLUMN pause_time TEXT DEFAULT NULL");
  }

  console.log(`[db] Connected → ${dbPath}`);
}

function isUsingTurso() {
  return _mode === "turso";
}

module.exports = { getDb, initDb, isUsingTurso };
