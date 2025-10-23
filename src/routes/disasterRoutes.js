import express from "express";
import { disasterController } from "../controllers/index.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * Disaster Routes
 * Base path: /api/disasters
 */

// ==================== PUBLIC ROUTES (No Authentication Required) ====================

/**
 * GET /api/disasters/active
 * Purpose: Retrieve all currently active disasters
 * Access: Public
 * Query Params: ?limit=50 (optional)
 * Use Case: Display active disasters on map/dashboard for all users
 */
router.get("/active", disasterController.getActiveDisasters);

/**
 * GET /api/disasters/nearby
 * Purpose: Find disasters near a specific location using coordinates
 * Access: Public
 * Query Params: ?lat=14.5995&lng=120.9842&radius=50 (lat, lng required; radius optional)
 * Use Case: Show disasters within a certain radius of user's location
 */
router.get("/nearby", disasterController.getNearbyDisasters);

/**
 * GET /api/disasters/type/:type
 * Purpose: Filter disasters by specific type (earthquake, flood, typhoon, etc.)
 * Access: Public
 * Params: :type (disaster type)
 * Query Params: ?limit=20 (optional)
 * Use Case: View all disasters of a specific category
 */
router.get("/type/:type", disasterController.getDisastersByType);

/**
 * GET /api/disasters/:id
 * Purpose: Retrieve detailed information about a specific disaster
 * Access: Public
 * Params: :id (disaster ID)
 * Use Case: View full disaster details, casualties, location, and help requests
 */
router.get("/:id", disasterController.getDisasterById);

// ==================== PROTECTED ROUTES (Authentication Required) ====================

/**
 * POST /api/disasters
 * Purpose: Create a new disaster report
 * Access: Authenticated users only
 * Body: { title, description, type, severity, location, images, casualties, needsHelp }
 * Use Case: Citizens, volunteers, or organizations report new disasters
 */
router.post("/", verifyToken, disasterController.createDisaster);

/**
 * PUT /api/disasters/:id
 * Purpose: Update an existing disaster report
 * Access: Disaster owner or admin only
 * Params: :id (disaster ID)
 * Body: Any disaster fields to update
 * Use Case: Update disaster information as situation evolves
 */
router.put("/:id", verifyToken, disasterController.updateDisaster);

/**
 * PATCH /api/disasters/:id/status
 * Purpose: Change disaster status (active, resolved, monitoring)
 * Access: Authenticated users
 * Params: :id (disaster ID)
 * Body: { status: "active" | "resolved" | "monitoring" }
 * Use Case: Update disaster lifecycle status
 */
router.patch("/:id/status", verifyToken, disasterController.updateDisasterStatus);

/**
 * PATCH /api/disasters/:id/verify
 * Purpose: Verify a disaster report as legitimate
 * Access: Admin only
 * Params: :id (disaster ID)
 * Use Case: Admins verify reports to prevent false information
 */
router.patch("/:id/verify", verifyToken, disasterController.verifyDisaster);

/**
 * DELETE /api/disasters/:id
 * Purpose: Remove a disaster report from the system
 * Access: Disaster owner or admin only
 * Params: :id (disaster ID)
 * Use Case: Delete false reports or outdated information
 */
router.delete("/:id", verifyToken, disasterController.deleteDisaster);

export default router;
