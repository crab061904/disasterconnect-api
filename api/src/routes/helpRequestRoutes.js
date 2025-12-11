import express from "express";
import { helpRequestController } from "../controllers/index.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * Help Request Routes
 * Base path: /api/help-requests
 */

// ==================== PUBLIC ROUTES (No Authentication Required) ====================

/**
 * GET /api/help-requests/pending
 * Purpose: Retrieve all pending help requests that need assistance
 * Access: Public
 * Query Params: ?limit=50 (optional)
 * Use Case: Display urgent help requests for volunteers/organizations to respond to
 */
router.get("/pending", helpRequestController.getPendingHelpRequests);

/**
 * GET /api/help-requests/disaster/:disasterId
 * Purpose: Get all help requests associated with a specific disaster
 * Access: Public
 * Params: :disasterId (disaster ID)
 * Query Params: ?limit=50 (optional)
 * Use Case: View all help requests for a particular disaster event
 */
router.get("/disaster/:disasterId", helpRequestController.getHelpRequestsByDisaster);

/**
 * GET /api/help-requests/:id
 * Purpose: Retrieve detailed information about a specific help request
 * Access: Public
 * Params: :id (help request ID)
 * Use Case: View full details of a help request including location, urgency, and contact info
 */
router.get("/:id", helpRequestController.getHelpRequestById);

// ==================== PROTECTED ROUTES (Authentication Required) ====================

/**
 * POST /api/help-requests
 * Purpose: Submit a new help request during a disaster
 * Access: Authenticated users only
 * Body: { disasterId, title, description, urgency, type, location, contactInfo, numberOfPeople, images }
 * Use Case: People in need request assistance (medical, food, rescue, shelter, etc.)
 */
router.post("/", authenticate, helpRequestController.createHelpRequest);

/**
 * PUT /api/help-requests/:id
 * Purpose: Update an existing help request
 * Access: Request owner or admin only
 * Params: :id (help request ID)
 * Body: Any help request fields to update
 * Use Case: Update request details, urgency level, or number of people affected
 */
router.put("/:id", authenticate, helpRequestController.updateHelpRequest);

/**
 * PATCH /api/help-requests/:id/assign
 * Purpose: Assign a help request to a volunteer or organization
 * Access: Authenticated users (volunteers/organizations)
 * Params: :id (help request ID)
 * Body: { assigneeUid: "volunteer123" }
 * Use Case: Volunteers/organizations claim responsibility for fulfilling a request
 */
router.patch("/:id/assign", authenticate, helpRequestController.assignHelpRequest);

/**
 * PATCH /api/help-requests/:id/fulfill
 * Purpose: Mark a help request as completed/fulfilled
 * Access: Assigned person, request owner, or admin
 * Params: :id (help request ID)
 * Use Case: Mark request as completed after assistance has been provided
 */
router.patch("/:id/fulfill", authenticate, helpRequestController.fulfillHelpRequest);

/**
 * PATCH /api/help-requests/:id/status
 * Purpose: Update the status of a help request
 * Access: Authenticated users
 * Params: :id (help request ID)
 * Body: { status: "pending" | "in_progress" | "fulfilled" | "cancelled" }
 * Use Case: Track progress of help request through its lifecycle
 */
router.patch("/:id/status", authenticate, helpRequestController.updateHelpRequestStatus);

/**
 * DELETE /api/help-requests/:id
 * Purpose: Remove a help request from the system
 * Access: Request owner or admin only
 * Params: :id (help request ID)
 * Use Case: Delete duplicate, resolved, or invalid help requests
 */
router.delete("/:id", authenticate, helpRequestController.deleteHelpRequest);

export default router;
