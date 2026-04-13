const sanitizeHtml = require("sanitize-html");

/**
 * Strip HTML tags from supported text fields while preserving all other values.
 * @param {Record<string, any>} fields
 * @returns {Record<string, any>}
 */
function sanitizeFields(fields = {}) {
  const sanitized = { ...fields };

  for (const key of ["name", "notes"]) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeHtml(sanitized[key], {
        allowedTags: [],
        allowedAttributes: {},
      });
    }
  }

  return sanitized;
}

module.exports = { sanitizeFields };
