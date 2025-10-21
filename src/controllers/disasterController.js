import { Disaster } from "../models/index.js";

/**
 * Disaster Controller
 * Handles all disaster-related operations
 */
export const disasterController = {
  /**
   * Create a new disaster report
   * POST /api/disasters
   */
  async createDisaster(req, res) {
    try {
      const { title, description, type, severity, location, images, casualties, needsHelp } =
        req.body;

      // Validate required fields
      if (!title || !description || !type || !severity || !location) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Get user ID from auth middleware (req.user should be set by auth middleware)
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const disaster = new Disaster({
        title,
        description,
        type,
        severity,
        location,
        reportedBy: userId,
        images: images || [],
        casualties: casualties || { injured: 0, deceased: 0, missing: 0 },
        needsHelp: needsHelp || [],
      });

      await disaster.save();

      res.status(201).json({
        success: true,
        message: "Disaster reported successfully",
        data: disaster,
      });
    } catch (error) {
      console.error("Error creating disaster:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get all active disasters
   * GET /api/disasters/active
   */
  async getActiveDisasters(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const disasters = await Disaster.getActive(limit);

      res.json({
        success: true,
        count: disasters.length,
        data: disasters,
      });
    } catch (error) {
      console.error("Error fetching active disasters:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get disaster by ID
   * GET /api/disasters/:id
   */
  async getDisasterById(req, res) {
    try {
      const { id } = req.params;
      const disaster = await Disaster.getById(id);

      if (!disaster) {
        return res.status(404).json({
          success: false,
          message: "Disaster not found",
        });
      }

      res.json({
        success: true,
        data: disaster,
      });
    } catch (error) {
      console.error("Error fetching disaster:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get disasters by type
   * GET /api/disasters/type/:type
   */
  async getDisastersByType(req, res) {
    try {
      const { type } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const disasters = await Disaster.getByType(type, limit);

      res.json({
        success: true,
        count: disasters.length,
        data: disasters,
      });
    } catch (error) {
      console.error("Error fetching disasters by type:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get disasters by location
   * GET /api/disasters/nearby?lat=14.5995&lng=120.9842&radius=50
   */
  async getNearbyDisasters(req, res) {
    try {
      const { lat, lng, radius } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude are required",
        });
      }

      const radiusKm = parseInt(radius) || 50;
      const disasters = await Disaster.getByLocation(
        parseFloat(lat),
        parseFloat(lng),
        radiusKm
      );

      res.json({
        success: true,
        count: disasters.length,
        data: disasters,
      });
    } catch (error) {
      console.error("Error fetching nearby disasters:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Update disaster
   * PUT /api/disasters/:id
   */
  async updateDisaster(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.uid;

      const disaster = await Disaster.getById(id);
      if (!disaster) {
        return res.status(404).json({
          success: false,
          message: "Disaster not found",
        });
      }

      // Check if user is authorized to update (owner or admin)
      const isOwner = disaster.reportedBy === userId;
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this disaster",
        });
      }

      // Update allowed fields
      Object.assign(disaster, updates);
      await disaster.save();

      res.json({
        success: true,
        message: "Disaster updated successfully",
        data: disaster,
      });
    } catch (error) {
      console.error("Error updating disaster:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Update disaster status
   * PATCH /api/disasters/:id/status
   */
  async updateDisasterStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["active", "resolved", "monitoring"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be: active, resolved, or monitoring",
        });
      }

      const disaster = await Disaster.getById(id);
      if (!disaster) {
        return res.status(404).json({
          success: false,
          message: "Disaster not found",
        });
      }

      disaster.status = status;
      await disaster.save();

      res.json({
        success: true,
        message: "Disaster status updated",
        data: disaster,
      });
    } catch (error) {
      console.error("Error updating disaster status:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Verify disaster (admin only)
   * PATCH /api/disasters/:id/verify
   */
  async verifyDisaster(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can verify disasters",
        });
      }

      const disaster = await Disaster.getById(id);
      if (!disaster) {
        return res.status(404).json({
          success: false,
          message: "Disaster not found",
        });
      }

      disaster.isVerified = true;
      disaster.verifiedBy = userId;
      await disaster.save();

      res.json({
        success: true,
        message: "Disaster verified successfully",
        data: disaster,
      });
    } catch (error) {
      console.error("Error verifying disaster:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Delete disaster
   * DELETE /api/disasters/:id
   */
  async deleteDisaster(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.uid;

      const disaster = await Disaster.getById(id);
      if (!disaster) {
        return res.status(404).json({
          success: false,
          message: "Disaster not found",
        });
      }

      // Check if user is authorized to delete (owner or admin)
      const isOwner = disaster.reportedBy === userId;
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this disaster",
        });
      }

      await disaster.delete();

      res.json({
        success: true,
        message: "Disaster deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting disaster:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
