// src/routes/snapshots.js

const asyncHandler = require("../utils/asyncHandler");
const express = require("express");
const router = express.Router();

const {
  createSnapshot,
  getSnapshots,
  getSnapshotById,
  updateSnapshot,
  deleteSnapshot,
} = require("../controllers/snapshotsController");

// Routes → just map to controller

router.get("/", asyncHandler(getSnapshots));
router.post("/", asyncHandler(createSnapshot));
router.get("/:id", asyncHandler(getSnapshotById));
router.patch("/:id", asyncHandler(updateSnapshot));
router.delete("/:id", asyncHandler(deleteSnapshot));

module.exports = router;