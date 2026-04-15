// src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

/**
 * Global limiter — all routes.
 * 100 requests per 15 minutes per IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

/**
 * Strict limiter — auth routes.
 * 20 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many attempts, please try again in 15 minutes.",
  },
});

/**
 * Strict limiter — write routes (POST, PATCH).
 * 20 requests per 15 minutes per IP.
 */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many write requests, please slow down.",
  },
});

module.exports = { globalLimiter, authLimiter, writeLimiter };