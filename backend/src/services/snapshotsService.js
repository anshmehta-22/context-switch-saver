// src/services/snapshotsService.js
// Pure data-access functions — no Express req/res here.
// Each function is unit-testable in isolation.

const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../database/db");
const { sanitizeFields } = require("../middleware/sanitize");

// ─── helpers ────────────────────────────────────────────────────────────────

/** Serialise array fields to JSON strings for SQLite storage. */
const toRow = ({
  id,
  name,
  notes = "",
  status = "active",
  urls = [],
  attachments = [],
  files = [],
  tags = [],
  pause_time,
  created_at,
  updated_at,
}) => ({
  id,
  name,
  notes,
  status,
  urls: JSON.stringify(urls),
  attachments: JSON.stringify(attachments),
  files: JSON.stringify(files),
  tags: JSON.stringify(tags),
  pause_time,
  created_at,
  updated_at,
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
    attachments: JSON.parse(row.attachments || "[]"),
    files: JSON.parse(row.files || "[]"),
    tags: JSON.parse(row.tags || "[]"),
    pauseTime: row.pause_time,
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
  const sanitizedFields = sanitizeFields(fields);

  const now = new Date().toISOString();

  const row = toRow({
    id: uuidv4(),
    ...sanitizedFields,
    created_at: now,
    updated_at: now,
  });

  db.prepare(
    `
    INSERT INTO snapshots (id, name, notes, status, urls, attachments, files, tags, pause_time, created_at, updated_at)
    VALUES (@id, @name, @notes, @status, @urls, @attachments, @files, @tags, @pause_time, @created_at, @updated_at)
  `,
  ).run(row);

  return fromRow(
    db.prepare("SELECT * FROM snapshots WHERE id = ?").get(row.id),
  );
}

/**
 * Return all snapshots, optionally filtered by status, search, and tag.
 * @param {{ status?, search?, tag? }} filters
 */
function getSnapshots({ status, search, tag, page = 1, limit = 5 } = {}) {
  const db = getDb();

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  if (search) {
    conditions.push(
      "(name LIKE ? OR notes LIKE ? OR EXISTS (SELECT 1 FROM json_each(tags) WHERE value LIKE ?))",
    );
    params.push(`%${search}%`);
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  if (tag) {
    conditions.push(
      "EXISTS (SELECT 1 FROM json_each(tags) WHERE value LIKE ?)",
    );
    params.push(`%${tag}%`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // COUNT total matching rows
  const { count: total } = db
    .prepare(`SELECT COUNT(*) as count FROM snapshots ${whereClause}`)
    .get(...params);

  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const rows = db
    .prepare(
      `SELECT * FROM snapshots ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset);

  return {
    data: rows.map(fromRow),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
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
 * @param {{ name?, notes?, status?, urls?, attachments?, files?, tags? }} fields
 */
function updateSnapshot(id, fields) {
  const db = getDb();
  const sanitizedFields = sanitizeFields(fields);
  const ALLOWED = [
    "name",
    "notes",
    "status",
    "urls",
    "attachments",
    "files",
    "tags",
  ];
  const updates = {};

  for (const key of ALLOWED) {
    if (sanitizedFields[key] !== undefined) {
      updates[key] = Array.isArray(sanitizedFields[key])
        ? JSON.stringify(sanitizedFields[key])
        : sanitizedFields[key];
    }
  }

  // Handle pause_time: set when pausing, clear when resuming/completing
  if (sanitizedFields.status !== undefined) {
    if (sanitizedFields.status === "paused") {
      updates.pause_time = new Date().toISOString();
    } else {
      updates.pause_time = null;
    }
  }

  if (Object.keys(updates).length === 0) return getSnapshotById(id);

  updates.updated_at = new Date().toISOString();

  const setClauses = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(", ");
  db.prepare(
    `
    UPDATE snapshots
    SET ${setClauses}, updated_at = @updated_at
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
