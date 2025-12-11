import { HelpRequest } from "../models/index.js";

/**
 * HelpRequest Controller
 * Handles all help request-related operations
 */
export const helpRequestController = {
  /**
   * Create a new help request
   * POST /api/help-requests
   */
  async createHelpRequest(req, res) {
    try {
      const {
        disasterId,
        title,
        description,
        urgency,
        type,
        location,
        contactInfo,
        numberOfPeople,
        images,
      } = req.body;

      // Validate required fields
      if (!disasterId || !title || !description || !urgency || !type || !location) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Get user ID from auth middleware
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const helpRequest = new HelpRequest({
        disasterId,
        requestedBy: userId,
        title,
        description,
        urgency,
        type,
        location,
        contactInfo: contactInfo || {},
        numberOfPeople: numberOfPeople || 1,
        images: images || [],
      });

      await helpRequest.save();

      res.status(201).json({
        success: true,
        message: "Help request created successfully",
        data: helpRequest,
      });
    } catch (error) {
      console.error("Error creating help request:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get help request by ID
   * GET /api/help-requests/:id
   */
  async getHelpRequestById(req, res) {
    try {
      const { id } = req.params;
      const helpRequest = await HelpRequest.getById(id);

      if (!helpRequest) {
        return res.status(404).json({
          success: false,
          message: "Help request not found",
        });
      }

      res.json({
        success: true,
        data: helpRequest,
      });
    } catch (error) {
      console.error("Error fetching help request:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get help requests by disaster
   * GET /api/help-requests/disaster/:disasterId
   */
  async getHelpRequestsByDisaster(req, res) {
    try {
      const { disasterId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const helpRequests = await HelpRequest.getByDisaster(disasterId, limit);

      res.json({
        success: true,
        count: helpRequests.length,
        data: helpRequests,
      });
    } catch (error) {
      console.error("Error fetching help requests by disaster:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get all pending help requests
   * GET /api/help-requests/pending
   */
  async getPendingHelpRequests(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const helpRequests = await HelpRequest.getPending(limit);

      res.json({
        success: true,
        count: helpRequests.length,
        data: helpRequests,
      });
    } catch (error) {
      console.error("Error fetching pending help requests:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Update help request
   * PUT /api/help-requests/:id
   */
  async updateHelpRequest(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.uid;

      const helpRequest = await HelpRequest.getById(id);
      if (!helpRequest) {
        return res.status(404).json({
          success: false,
          message: "Help request not found",
        });
      }

      // Check if user is authorized to update (owner or admin)
      const isOwner = helpRequest.requestedBy === userId;
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this help request",
        });
      }

      // Update allowed fields
      Object.assign(helpRequest, updates);
      await helpRequest.save();

      res.json({
        success: true,
        message: "Help request updated successfully",
        data: helpRequest,
      });
    } catch (error) {
      console.error("Error updating help request:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Assign help request to volunteer/organization
   * PATCH /api/help-requests/:id/assign
   */
  async assignHelpRequest(req, res) {
    try {
      const { id } = req.params;
      const { assigneeUid } = req.body;

      if (!assigneeUid) {
        return res.status(400).json({
          success: false,
          message: "Assignee UID is required",
        });
      }

      const helpRequest = await HelpRequest.getById(id);
      if (!helpRequest) {
        return res.status(404).json({
          success: false,
          message: "Help request not found",
        });
      }

      await helpRequest.assignTo(assigneeUid);

      res.json({
        success: true,
        message: "Help request assigned successfully",
        data: helpRequest,
      });
    } catch (error) {
      console.error("Error assigning help request:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Mark help request as fulfilled
   * PATCH /api/help-requests/:id/fulfill
   */
  async fulfillHelpRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      const helpRequest = await HelpRequest.getById(id);
      if (!helpRequest) {
        return res.status(404).json({
          success: false,
          message: "Help request not found",
        });
      }

      // Check if user is authorized (assigned person, owner, or admin)
      const isAssigned = helpRequest.assignedTo === userId;
      const isOwner = helpRequest.requestedBy === userId;
      const isAdmin = req.user?.role === "admin";

      if (!isAssigned && !isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to fulfill this help request",
        });
      }

      await helpRequest.markFulfilled();

      res.json({
        success: true,
        message: "Help request marked as fulfilled",
        data: helpRequest,
      });
    } catch (error) {
      console.error("Error fulfilling help request:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Update help request status
   * PATCH /api/help-requests/:id/status
   */
  async updateHelpRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["pending", "in_progress", "fulfilled", "cancelled"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be: pending, in_progress, fulfilled, or cancelled",
        });
      }

      const helpRequest = await HelpRequest.getById(id);
      if (!helpRequest) {
        return res.status(404).json({
          success: false,
          message: "Help request not found",
        });
      }

      helpRequest.status = status;
      if (status === "fulfilled") {
        helpRequest.fulfilledAt = new Date();
      }
      await helpRequest.save();

      res.json({
        success: true,
        message: "Help request status updated",
        data: helpRequest,
      });
    } catch (error) {
      console.error("Error updating help request status:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Delete help request
   * DELETE /api/help-requests/:id
   */
  async deleteHelpRequest(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      const helpRequest = await HelpRequest.getById(id);
      if (!helpRequest) {
        return res.status(404).json({
          success: false,
          message: "Help request not found",
        });
      }

      // Check if user is authorized to delete (owner or admin)
      const isOwner = helpRequest.requestedBy === userId;
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this help request",
        });
      }

      await helpRequest.delete();

      res.json({
        success: true,
        message: "Help request deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting help request:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
