// src/index.js
// Entry point — wires up Express middleware, routes, and starts the server.

const express = require("express");
const cors = require("cors");
const { initDb } = require("./database/db");
const snapshotRoutes = require("./routes/snapshots");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/snapshots", snapshotRoutes);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
initDb();
app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
