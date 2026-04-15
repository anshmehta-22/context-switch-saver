// src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { initDb } = require("./database/db");
const authRoutes = require("./routes/auth");
const snapshotRoutes = require("./routes/snapshots");
const chatRoutes = require("./routes/chat");
const { globalLimiter } = require("./middleware/rateLimiter");
const logger = require("./middleware/logger");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Allowed origins ─────────────────────────────────────────────────────────
// In production Electron, the frontend loads from file:// or app://
const ALLOWED_ORIGINS = [
  process.env.CORS_ORIGIN || "http://localhost:5173",
  "file://",
  "app://.",
  "http://localhost:5173",
];

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Electron, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(logger);
app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.path === '/api/auth/me') return next();
  return globalLimiter(req, res, next);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/snapshots", snapshotRoutes);
app.use("/api/chat", chatRoutes);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
initDb();
const server = app.listen(PORT);

server.on("listening", () => {
  console.log(`[server] http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[server] Port ${PORT} is already in use. Stop the existing process or start with a different PORT.`,
    );
    process.exit(1);
  }

  console.error("[server] Failed to start", err);
  process.exit(1);
});
