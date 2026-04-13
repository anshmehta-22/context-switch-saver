// src/validators/snapshots.js
// Zod schemas for snapshot request bodies and query params.

const { z } = require("zod");

// ─── Shared field definitions ────────────────────────────────────────────────

const urlItem = z
  .string({ invalid_type_error: "Each URL must be a string" })
  .url("Each URL must be a valid URL (include https://)");

const tagItem = z
  .string({ invalid_type_error: "Each tag must be a string" })
  .min(1, "Tags cannot be empty strings")
  .max(50, "Each tag must be 50 characters or fewer");

const attachmentItem = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().startsWith("image/", "Attachments must be images"),
  size: z.number().max(2 * 1024 * 1024, "Each attachment must be under 2MB"),
  dataUrl: z.string().min(1),
});

const fileItem = z.object({
  path: z.string().min(1, "File path cannot be empty"),
  line: z.number().int().nonnegative().optional(),
  col: z.number().int().nonnegative().optional(),
});

const STATUS_VALUES = ["active", "paused", "complete"];

// ─── Schemas ─────────────────────────────────────────────────────────────────

/**
 * POST /api/snapshots
 * name is required; everything else is optional with safe defaults.
 */
const createSnapshotSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name is required")
    .max(200, "name must be 200 characters or fewer"),

  notes: z
    .string({ invalid_type_error: "notes must be a string" })
    .max(10_000, "notes must be 10 000 characters or fewer")
    .optional()
    .default(""),

  status: z
    .enum(STATUS_VALUES, {
      errorMap: () => ({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` }),
    })
    .optional()
    .default("active"),

  urls: z
    .array(urlItem)
    .max(20, "You can save up to 20 URLs per snapshot")
    .optional()
    .default([]),

  attachments: z
    .array(attachmentItem)
    .max(5, "You can attach up to 5 screenshots")
    .optional()
    .default([]),

  files: z
    .array(fileItem)
    .max(50, "You can save up to 50 file references per snapshot")
    .optional()
    .default([]),

  tags: z
    .array(tagItem)
    .max(20, "You can add up to 20 tags per snapshot")
    .optional()
    .default([]),
});

/**
 * PATCH /api/snapshots/:id
 * All fields optional — only the ones sent are updated.
 */
const updateSnapshotSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "name cannot be empty")
      .max(200, "name must be 200 characters or fewer")
      .optional(),

    notes: z
      .string()
      .max(10_000, "notes must be 10 000 characters or fewer")
      .optional(),

    status: z
      .enum(STATUS_VALUES, {
        errorMap: () => ({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` }),
      })
      .optional(),

    urls: z
      .array(urlItem)
      .max(20, "You can save up to 20 URLs per snapshot")
      .optional(),

    attachments: z
      .array(attachmentItem)
      .max(5, "You can attach up to 5 screenshots")
      .optional(),

    files: z
      .array(fileItem)
      .max(50, "You can save up to 50 file references per snapshot")
      .optional(),

    tags: z
      .array(tagItem)
      .max(20, "You can add up to 20 tags per snapshot")
      .optional(),
  })
  .strict("Unrecognised fields are not allowed");

/**
 * GET /api/snapshots?status=...
 * status query param is optional but must be a valid value if provided.
 */
const listSnapshotsQuerySchema = z.object({
  status: z
    .enum(STATUS_VALUES, {
      errorMap: () => ({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` }),
    })
    .optional(),

  search: z
    .string()
    .max(200, "search must be 200 characters or fewer")
    .optional(),

  tag: z
    .string()
    .max(50, "tag must be 50 characters or fewer")
    .optional(),

  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(5),  
});

module.exports = {
  createSnapshotSchema,
  updateSnapshotSchema,
  listSnapshotsQuerySchema,
};