import express from "express";
import { helpRequestController } from "../controllers/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Help Request Routes
 * Base path: /api/help-requests
 */

// Public routes (no auth required)
router.get("/pending", helpRequestController.getPendingHelpRequests);
router.get("/disaster/:disasterId", helpRequestController.getHelpRequestsByDisaster);
router.get("/:id", helpRequestController.getHelpRequestById);

// Protected routes (auth required)
router.post("/", verifyToken, helpRequestController.createHelpRequest);
router.put("/:id", verifyToken, helpRequestController.updateHelpRequest);
router.patch("/:id/assign", verifyToken, helpRequestController.assignHelpRequest);
router.patch("/:id/fulfill", verifyToken, helpRequestController.fulfillHelpRequest);
router.patch("/:id/status", verifyToken, helpRequestController.updateHelpRequestStatus);
router.delete("/:id", verifyToken, helpRequestController.deleteHelpRequest);

export default router;
