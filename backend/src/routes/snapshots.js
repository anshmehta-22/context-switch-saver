// src/routes/snapshots.js
// Express router — thin layer that validates input and delegates to the controller.

const express = require('express');
const router  = express.Router();
const {
  createSnapshot,
  getSnapshots,
  getSnapshotById,
  updateSnapshot,
  deleteSnapshot,
} = require('../controllers/snapshotsController');

// ─── GET /snapshots?status=active ────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const VALID = ['active', 'paused', 'complete'];
    if (status && !VALID.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
    }
    res.json({ data: getSnapshots(status) });
  } catch (err) {
    console.error('[GET /snapshots]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /snapshots ─────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, notes, urls, files, tags } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const snapshot = createSnapshot({
      name: name.trim(),
      notes:  notes  ?? '',
      urls:   Array.isArray(urls)  ? urls  : [],
      files:  Array.isArray(files) ? files : [],
      tags:   Array.isArray(tags)  ? tags  : [],
    });

    res.status(201).json({ data: snapshot });
  } catch (err) {
    console.error('[POST /snapshots]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /snapshots/:id ───────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const snapshot = getSnapshotById(req.params.id);
    if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
    res.json({ data: snapshot });
  } catch (err) {
    console.error('[GET /snapshots/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /snapshots/:id ─────────────────────────────────────────────────────
router.patch('/:id', (req, res) => {
  try {
    const existing = getSnapshotById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Snapshot not found' });

    const VALID_STATUS = ['active', 'paused', 'complete'];
    if (req.body.status && !VALID_STATUS.includes(req.body.status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUS.join(', ')}` });
    }

    const updated = updateSnapshot(req.params.id, req.body);
    res.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /snapshots/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /snapshots/:id ────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteSnapshot(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Snapshot not found' });
    res.status(204).end();
  } catch (err) {
    console.error('[DELETE /snapshots/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;