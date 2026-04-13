// src/routes/chat.js

const asyncHandler = require("../utils/asyncHandler");
const express = require("express");
const router = express.Router();

const { parseSnapshotInput } = require("../services/parseService");

// POST /api/chat/parse - Parse raw text into structured snapshot fields
router.post(
  "/parse",
  asyncHandler(async (req, res) => {
    const { input } = req.body;

    // Validate input
    if (!input || input.trim() === "") {
      return res.status(400).json({ error: "input is required" });
    }

    // Parse the input using Gemini
    const result = await parseSnapshotInput(input);

    // Return structured data
    return res.status(200).json({ data: result });
  }),
);

module.exports = router;
