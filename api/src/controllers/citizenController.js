import { HelpRequest, EvacuationCenter } from "../models/index.js";
import { BaseController } from "./BaseController.js";
import { db } from "../config/firebase.js"; // Ensure you import db

export const citizenController = {
  // POST /api/citizen/requests
  // FIX 1: Changed syntax from "createRequest =" to "createRequest:"
  createRequest: async (req, res) => {
    try {
      // FIX 2: Extract 'details' as 'description' to handle frontend mismatch
      const { disasterId, type, description, details, location } = req.body;

      const helpRequestData = {
        // FIX 3: Safety check - Convert undefined to null to prevent crash
        disasterId: disasterId || null,
        
        type,
        // Accept either 'description' or 'details' from frontend
        description: description || details || "No description provided",
        location,
        status: 'pending',
        createdAt: new Date(),
        requestedBy: req.user.uid
      };

      // Save to Firestore
      const docRef = await db.collection('help_requests').add(helpRequestData);

      res.status(201).json({ success: true, id: docRef.id });

    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/citizen/requests/active
  async getMyActiveRequests(req, res) {
    try {
      const userId = req.user.uid;
      const requests = await HelpRequest.getByUser(userId);
      return BaseController.success(res, requests);
    } catch (error) {
      return BaseController.error(res, error.message);
    }
  },

  // GET /api/citizen/centers
  async getAllCenters(req, res) {
    try {
      const centers = await EvacuationCenter.getAllActive();
      return BaseController.success(res, centers);
    } catch (error) {
      return BaseController.error(res, error.message);
    }
  }
};