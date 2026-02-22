// src/db/db.js
// Initialises a single shared better-sqlite3 connection.
// Call initDb() once at startup; then import getDb() anywhere.

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH     = process.env.DB_PATH || path.join(__dirname, '../../../data/snapshots.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let _db = null;

/**
 * Returns the shared DB instance (lazy-initialised).
 */
function getDb() {
  if (!_db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL'); // better concurrent read performance
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

/**
 * Applies schema.sql — idempotent, safe to call on every startup.
 */
function initDb() {
  const db     = getDb();
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  console.log(`[db] Connected → ${DB_PATH}`);
}

module.exports = { getDb, initDb };