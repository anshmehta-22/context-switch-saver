const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { getDb, isUsingTurso } = require("../database/db");

const SALT_ROUNDS = 12;

async function queryOne(db, sql, args = []) {
  if (isUsingTurso()) {
    const result = await db.execute({ sql, args });
    return result.rows[0] ?? null;
  }

  return db.prepare(sql).get(...args);
}

async function executeWrite(db, sql, args = []) {
  if (isUsingTurso()) {
    await db.execute({ sql, args });
    return;
  }

  db.prepare(sql).run(...args);
}

function stripPassword(user) {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
}

async function registerUser({ email, password }) {
  const db = getDb();
  const existing = await queryOne(
    db,
    "SELECT id FROM users WHERE email = ? COLLATE NOCASE",
    [email],
  );

  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const now = new Date().toISOString();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    created_at: now,
    updated_at: now,
  };

  await executeWrite(
    db,
    `
      INSERT INTO users (id, email, password, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    [user.id, user.email, user.password, user.created_at, user.updated_at],
  );

  return stripPassword(user);
}

async function loginUser({ email, password }) {
  const db = getDb();
  const user = await queryOne(
    db,
    "SELECT * FROM users WHERE email = ? COLLATE NOCASE",
    [email],
  );

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return stripPassword(user);
}

async function getUserById(id) {
  const db = getDb();
  const user = await queryOne(db, "SELECT * FROM users WHERE id = ?", [id]);

  return stripPassword(user);
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
