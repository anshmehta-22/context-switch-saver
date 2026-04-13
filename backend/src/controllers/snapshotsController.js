// src/controllers/snapshotsController.js
// Thin controllers — validation is handled by Zod middleware in routes.

const snapshotService = require("../services/snapshotsService");

function createSnapshot(req, res) {
  // req.body is already validated + defaults applied by middleware
  const snapshot = snapshotService.createSnapshot(req.body);
  res.status(201).json({ data: snapshot });
}

function getSnapshots(req, res) {
  const { status, search, tag, page, limit } = req.query;
  const result = snapshotService.getSnapshots({
    status,
    search,
    tag,
    page,
    limit,
  });
  res.json({ data: result.data, pagination: result.pagination });
}

function getSnapshotById(req, res) {
  const snapshot = snapshotService.getSnapshotById(req.params.id);
  if (!snapshot) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({ data: snapshot });
}

function updateSnapshot(req, res) {
  const updated = snapshotService.updateSnapshot(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({ data: updated });
}

function deleteSnapshot(req, res) {
  const deleted = snapshotService.deleteSnapshot(req.params.id);
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
