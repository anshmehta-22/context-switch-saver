const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

function getTokenOptions() {
  return {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

async function register(req, res) {
  try {
    const user = await authService.registerUser(req.body);
    const token = signToken(user);

    res.cookie("token", token, getTokenOptions());
    return res.status(201).json({ data: { user } });
  } catch (error) {
    if (error.message === "EMAIL_TAKEN") {
      return res
        .status(409)
        .json({ error: "An account with that email already exists" });
    }

    throw error;
  }
}

async function login(req, res) {
  try {
    const user = await authService.loginUser(req.body);
    const token = signToken(user);

    res.cookie("token", token, getTokenOptions());
    return res.status(200).json({ data: { user } });
  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    throw error;
  }
}

function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(200).json({ data: { message: "Logged out" } });
}

async function me(req, res) {
  const user = authService.getUserById(req.user.id);

  if (!user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  return res.status(200).json({ data: { user } });
}

module.exports = {
  register,
  login,
  logout,
  me,
};
