// src/routes/auth.js
import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// ==================== PUBLIC ROUTES (No Authentication Required) ====================

/**
 * POST /api/auth/register
 * Purpose: Register a new user account
 * Access: Public
 * Body: { email, password, name, role }
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 * Purpose: Authenticate user and receive JWT token
 * Access: Public
 * Body: { email, password }
 */
router.post("/login", authController.login);

/**
 * POST /api/auth/google
 * Purpose: Authenticate user with Google Sign-In
 * Access: Public
 * Body: { idToken, role? }
 */
router.post("/google", authController.googleLogin);

// ==================== PROTECTED ROUTES (Authentication Required) ====================

/**
 * GET /api/auth/profile
 * Purpose: Retrieve authenticated user's profile information
 * Access: Authenticated users only
 * Headers: Authorization: Bearer <token>
 */
router.get("/profile", verifyToken, authController.getProfile);

export default router;
