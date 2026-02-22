// src/controllers/snapshotsController.js
// Pure data-access functions — no Express req/res here.
// Each function is unit-testable in isolation.

const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../database/db");

// ─── helpers ────────────────────────────────────────────────────────────────

/** Serialise array fields to JSON strings for SQLite storage. */
const toRow = ({
  id,
  name,
  notes = "",
  status = "active",
  urls = [],
  files = [],
  tags = [],
}) => ({
  id,
  name,
  notes,
  status,
  urls: JSON.stringify(urls),
  files: JSON.stringify(files),
  tags: JSON.stringify(tags),
});

/** Deserialise a raw SQLite row into a clean JS object. */
const fromRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    status: row.status,
    urls: JSON.parse(row.urls || "[]"),
    files: JSON.parse(row.files || "[]"),
    tags: JSON.parse(row.tags || "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Create a new snapshot.
 * @param {{ name, notes?, urls?, files?, tags? }} fields
 */
function createSnapshot(fields) {
  const db = getDb();
  const row = toRow({ id: uuidv4(), ...fields });

  db.prepare(
    `
    INSERT INTO snapshots (id, name, notes, status, urls, files, tags)
    VALUES (@id, @name, @notes, @status, @urls, @files, @tags)
  `,
  ).run(row);

  return fromRow(
    db.prepare("SELECT * FROM snapshots WHERE id = ?").get(row.id),
  );
}

/**
 * Return all snapshots, optionally filtered by status.
 * @param {string|undefined} status  'active' | 'paused' | 'complete'
 */
function getSnapshots(status) {
  const db = getDb();
  const rows = status
    ? db
        .prepare(
          "SELECT * FROM snapshots WHERE status = ? ORDER BY created_at DESC",
        )
        .all(status)
    : db.prepare("SELECT * FROM snapshots ORDER BY created_at DESC").all();
  return rows.map(fromRow);
}

/**
 * Return a single snapshot by ID, or null if not found.
 * @param {string} id
 */
function getSnapshotById(id) {
  return fromRow(
    getDb().prepare("SELECT * FROM snapshots WHERE id = ?").get(id),
  );
}

/**
 * Update allowed fields on a snapshot.
 * @param {string} id
 * @param {{ name?, notes?, status?, urls?, files?, tags? }} fields
 */
function updateSnapshot(id, fields) {
  const db = getDb();
  const ALLOWED = ["name", "notes", "status", "urls", "files", "tags"];
  const updates = {};

  for (const key of ALLOWED) {
    if (fields[key] !== undefined) {
      updates[key] = Array.isArray(fields[key])
        ? JSON.stringify(fields[key])
        : fields[key];
    }
  }

  if (Object.keys(updates).length === 0) return getSnapshotById(id);

  const setClauses = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(", ");
  db.prepare(
    `
    UPDATE snapshots
    SET ${setClauses}, updated_at = datetime('now')
    WHERE id = @id
  `,
  ).run({ ...updates, id });

  return getSnapshotById(id);
}

/**
 * Delete a snapshot. Returns true if a row was deleted.
 * @param {string} id
 */
function deleteSnapshot(id) {
  const info = getDb().prepare("DELETE FROM snapshots WHERE id = ?").run(id);
  return info.changes > 0;
}

module.exports = {
  createSnapshot,
  getSnapshots,
  getSnapshotById,
  updateSnapshot,
  deleteSnapshot,
};
