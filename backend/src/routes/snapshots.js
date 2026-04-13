// src/routes/snapshots.js

const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate");
const { writeLimiter } = require("../middleware/rateLimiter");
const {
  createSnapshotSchema,
  updateSnapshotSchema,
  listSnapshotsQuerySchema,
} = require("../validators/snapshots");
const {
  createSnapshot,
  getSnapshots,
  getSnapshotById,
  updateSnapshot,
  deleteSnapshot,
} = require("../controllers/snapshotsController");

router.get(
  "/",
  validate(listSnapshotsQuerySchema, "query"),
  asyncHandler(getSnapshots),
);

router.post(
  "/",
  writeLimiter,
  validate(createSnapshotSchema),
  asyncHandler(createSnapshot),
);

router.get("/:id", asyncHandler(getSnapshotById));

router.patch(
  "/:id",
  writeLimiter,
  validate(updateSnapshotSchema),
  asyncHandler(updateSnapshot),
);

router.delete("/:id", asyncHandler(deleteSnapshot));

module.exports = router;
