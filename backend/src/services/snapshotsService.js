// src/services/snapshotsService.js
// Pure data-access functions — no Express req/res here.
// Each function is unit-testable in isolation.

const { v4: uuidv4 } = require("uuid");
const { getDb, isUsingTurso } = require("../database/db");
const { sanitizeFields } = require("../middleware/sanitize");

async function queryAll(db, sql, args = []) {
  if (isUsingTurso()) {
    const result = await db.execute({ sql, args });
    return result.rows;
  }

  return db.prepare(sql).all(...args);
}

async function queryOne(db, sql, args = []) {
  if (isUsingTurso()) {
    const result = await db.execute({ sql, args });
    return result.rows[0] ?? null;
  }

  return db.prepare(sql).get(...args);
}

async function executeWrite(db, sql, args = []) {
  if (isUsingTurso()) {
    const result = await db.execute({ sql, args });
    return { changes: result.rowsAffected ?? 0 };
  }

  return db.prepare(sql).run(...args);
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Serialise array fields to JSON strings for SQLite storage. */
const toRow = ({
  id,
  user_id,
  name,
  notes = "",
  status = "active",
  urls = [],
  attachments = [],
  files = [],
  tags = [],
  pause_time = null,
  created_at,
  updated_at,
}) => ({
  id,
  user_id,
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
    userId: row.user_id,
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
 * @param {{ userId, name, notes?, urls?, files?, tags? }} fields
 */
async function createSnapshot(fields) {
  const db = getDb();
  const sanitizedFields = sanitizeFields(fields);

  const now = new Date().toISOString();

  const row = toRow({
    id: uuidv4(),
    user_id: sanitizedFields.userId,
    ...sanitizedFields,
    created_at: now,
    updated_at: now,
  });

  await executeWrite(
    db,
    `
    INSERT INTO snapshots (id, user_id, name, notes, status, urls, attachments, files, tags, pause_time, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      row.id,
      row.user_id,
      row.name,
      row.notes,
      row.status,
      row.urls,
      row.attachments,
      row.files,
      row.tags,
      row.pause_time,
      row.created_at,
      row.updated_at,
    ],
  );

  return fromRow(
    await queryOne(db, "SELECT * FROM snapshots WHERE id = ?", [row.id]),
  );
}

/**
 * Return all snapshots, optionally filtered by status, search, and tag.
 * @param {{ userId, status?, search?, tag? }} filters
 */
async function getSnapshots({
  userId,
  status,
  search,
  tag,
  page = 1,
  limit = 5,
} = {}) {
  const db = getDb();

  const conditions = ["user_id = ?"];
  const params = [userId];

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
  const countRow = await queryOne(
    db,
    `SELECT COUNT(*) as count FROM snapshots ${whereClause}`,
    params,
  );
  const total = Number(countRow?.count ?? 0);

  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const rows = await queryAll(
    db,
    `SELECT * FROM snapshots ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

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
 * @param {string} userId
 */
async function getSnapshotById(id, userId) {
  const db = getDb();
  return fromRow(
    await queryOne(db, "SELECT * FROM snapshots WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]),
  );
}

/**
 * Update allowed fields on a snapshot.
 * @param {string} id
 * @param {{ name?, notes?, status?, urls?, attachments?, files?, tags? }} fields
 * @param {string} userId
 */
async function updateSnapshot(id, fields, userId) {
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

  if (Object.keys(updates).length === 0) return getSnapshotById(id, userId);

  updates.updated_at = new Date().toISOString();

  const setClauses = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.keys(updates).map((k) => updates[k]);

  await executeWrite(
    db,
    `
    UPDATE snapshots
    SET ${setClauses}
    WHERE id = ? AND user_id = ?
  `,
    [...values, id, userId],
  );

  return getSnapshotById(id, userId);
}

/**
 * Delete a snapshot. Returns true if a row was deleted.
 * @param {string} id
 * @param {string} userId
 */
async function deleteSnapshot(id, userId) {
  const info = await executeWrite(
    getDb(),
    "DELETE FROM snapshots WHERE id = ? AND user_id = ?",
    [id, userId],
  );
  return info.changes > 0;
}

module.exports = {
  createSnapshot,
  getSnapshots,
  getSnapshotById,
  updateSnapshot,
  deleteSnapshot,
};
