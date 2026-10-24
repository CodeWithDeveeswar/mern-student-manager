const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const token = req.cookies?.session;

  if (!token) {
    return res.status(401).json({
      message: "Please log in",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.clearCookie("session", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res.status(401).json({
      message: "Session expired. Please log in again.",
    });
  }
}

module.exports = requireAuth;
