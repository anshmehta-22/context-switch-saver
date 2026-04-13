const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch {
    return res
      .status(401)
      .json({ error: "Session expired, please log in again" });
  }
}

module.exports = { authenticate };
