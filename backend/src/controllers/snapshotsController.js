// src/controllers/snapshotsController.js
// Thin controllers — validation is handled by Zod middleware in routes.

const snapshotService = require("../services/snapshotsService");

async function createSnapshot(req, res) {
  // req.body is already validated + defaults applied by middleware
  const snapshot = await snapshotService.createSnapshot({
    userId: req.user.id,
    ...req.body,
  });
  res.status(201).json({ data: snapshot });
}

async function getSnapshots(req, res) {
  const { status, search, tag, page, limit } = req.query;
  const result = await snapshotService.getSnapshots({
    userId: req.user.id,
    status,
    search,
    tag,
    page,
    limit,
  });
  res.set("Cache-Control", "no-store");
  res.json({ data: result.data, pagination: result.pagination });
}

async function getSnapshotById(req, res) {
  const snapshot = await snapshotService.getSnapshotById(
    req.params.id,
    req.user.id,
  );
  if (!snapshot) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({ data: snapshot });
}

async function updateSnapshot(req, res) {
  const updated = await snapshotService.updateSnapshot(
    req.params.id,
    req.body,
    req.user.id,
  );
  if (!updated) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({ data: updated });
}

async function deleteSnapshot(req, res) {
  const deleted = await snapshotService.deleteSnapshot(
    req.params.id,
    req.user.id,
  );
  if (!deleted) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(204).end();
}

module.exports = {
  createSnapshot,
  getSnapshots,
  getSnapshotById,
  updateSnapshot,
  deleteSnapshot,
};
