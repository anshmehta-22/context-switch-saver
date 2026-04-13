// src/middleware/validate.js
// Factory that returns an Express middleware which validates
// req.body (or req.query) against a Zod schema.
// On failure → 400 with { error, details[] }.
// On success → calls next() and replaces the target with the parsed (coerced) value.

const { ZodError } = require("zod");

/**
 * @param {import("zod").ZodSchema} schema   Zod schema to validate against
 * @param {"body"|"query"} [target="body"]   Which part of the request to validate
 */
function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((e) => ({
        field: e.path.join(".") || target,
        message: e.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details,
      });
    }

    // Replace with parsed value so defaults and coercions take effect
    req[target] = result.data;
    next();
  };
}

module.exports = { validate };
