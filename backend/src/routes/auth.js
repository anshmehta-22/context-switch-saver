const express = require("express");
const { z } = require("zod");

const asyncHandler = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/authenticate");
const { authLimiter } = require("../middleware/rateLimiter");
const authController = require("../controllers/authController");

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);

router.post("/logout", authLimiter, asyncHandler(authController.logout));

router.get("/me", authenticate, asyncHandler(authController.me));

module.exports = router;
