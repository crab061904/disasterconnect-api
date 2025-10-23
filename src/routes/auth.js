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
 * Use Case: New users sign up for the platform (citizens, volunteers, organizations)
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 * Purpose: Authenticate user and receive JWT token
 * Access: Public
 * Body: { email, password }
 * Use Case: Existing users log in to access protected features
 */
router.post("/login", authController.login);

/**
 * POST /api/auth/google
 * Purpose: Authenticate user with Google Sign-In
 * Access: Public
 * Body: { idToken, role? }
 * Use Case: Users sign in with their Google account
 */
router.post("/google", authController.googleLogin);

// ==================== PROTECTED ROUTES (Authentication Required) ====================

/**
 * GET /api/auth/profile
 * Purpose: Retrieve authenticated user's profile information
 * Access: Authenticated users only
 * Headers: Authorization: Bearer <token>
 * Use Case: Get current user's details for profile display or verification
 */
router.get("/profile", verifyToken, authController.getProfile);

export default router;
