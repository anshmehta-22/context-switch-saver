const snapshotService = require("../services/snapshotsService");

// Create
function createSnapshot(req, res) {
  const { name, notes, urls, files, tags } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  const snapshot = snapshotService.createSnapshot({
    name: name.trim(),
    notes: notes ?? "",
    urls: Array.isArray(urls) ? urls : [],
    files: Array.isArray(files) ? files : [],
    tags: Array.isArray(tags) ? tags : [],
  });

  res.status(201).json({ data: snapshot });
}

// Get all
function getSnapshots(req, res) {
  const { status } = req.query;
  const data = snapshotService.getSnapshots(status);
  res.json({ data });
}

// Get by id
function getSnapshotById(req, res) {
  const snapshot = snapshotService.getSnapshotById(req.params.id);
  if (!snapshot) {
    return res.status(404).json({ error: "Snapshot not found" });
  }
  res.json({ data: snapshot });
}

// Update
function updateSnapshot(req, res) {
  const updated = snapshotService.updateSnapshot(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Snapshot not found" });
  }
  res.json({ data: updated });
}

// Delete
function deleteSnapshot(req, res) {
  const deleted = snapshotService.deleteSnapshot(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Snapshot not found" });
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