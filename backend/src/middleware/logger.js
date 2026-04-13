const morgan = require("morgan");

// Auto-select morgan format based on environment
// 'dev' format: concise colored output for development
// 'combined' format: standard Apache combined log for production
const logger =
  process.env.NODE_ENV === "production" ? morgan("combined") : morgan("dev");

module.exports = logger;
