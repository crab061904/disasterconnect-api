// src/middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT token and authenticate requests
 * Extracts token from Authorization header and validates it
 */
export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    req.user = payload;
    return next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Alias for backward compatibility
export const requireAuth = verifyToken;
export const authenticate = verifyToken;

// Default export for backward compatibility
export default {
  verifyToken,
  requireAuth,
  authenticate,
};
