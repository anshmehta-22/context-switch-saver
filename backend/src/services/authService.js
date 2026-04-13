const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../database/db");

const SALT_ROUNDS = 12;

function stripPassword(user) {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
}

async function registerUser({ email, password }) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE")
    .get(email);

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

  db.prepare(
    `
      INSERT INTO users (id, email, password, created_at, updated_at)
      VALUES (@id, @email, @password, @created_at, @updated_at)
    `,
  ).run(user);

  return stripPassword(user);
}

async function loginUser({ email, password }) {
  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return stripPassword(user);
}

function getUserById(id) {
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  return stripPassword(user);
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
