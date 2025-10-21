import express from "express";
import { disasterController } from "../controllers/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Disaster Routes
 * Base path: /api/disasters
 */

// Public routes (no auth required)
router.get("/active", disasterController.getActiveDisasters);
router.get("/nearby", disasterController.getNearbyDisasters);
router.get("/type/:type", disasterController.getDisastersByType);
router.get("/:id", disasterController.getDisasterById);

// Protected routes (auth required)
router.post("/", verifyToken, disasterController.createDisaster);
router.put("/:id", verifyToken, disasterController.updateDisaster);
router.patch("/:id/status", verifyToken, disasterController.updateDisasterStatus);
router.patch("/:id/verify", verifyToken, disasterController.verifyDisaster);
router.delete("/:id", verifyToken, disasterController.deleteDisaster);

export default router;
