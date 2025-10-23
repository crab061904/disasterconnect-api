import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT token and authenticate requests
 * Extracts token from Authorization header and validates it
 */
export function verifyToken(req, res, next) {
	const header = req.headers.authorization || "";
	const token = header.startsWith("Bearer ") ? header.slice(7) : null;
	if (!token) return res.status(401).json({ error: "Missing bearer token" });
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || "change-me");
		req.user = payload;
		return next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
}

// Alias for backward compatibility
export const requireAuth = verifyToken;

