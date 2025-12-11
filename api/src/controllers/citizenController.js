import { HelpRequest, EvacuationCenter } from "../models/index.js";
import { BaseController } from "./BaseController.js";
import { db } from "../firebaseAdmin.js";

export const citizenController = {
  
  // FIX: Use ':' not '='
  createRequest: async (req, res) => {
    try {
      console.log("Create Request Body:", req.body); // Keep this for debugging

      const { disasterId, type, description, details, location } = req.body;

      const helpRequestData = {
        disasterId: disasterId || null, 
        type,
        description: description || details || "No description provided",
        location,
        status: 'pending',
        createdAt: new Date(),
        requestedBy: req.user.uid 
      };

      const docRef = await db.collection('help_requests').add(helpRequestData);
      res.status(201).json({ success: true, id: docRef.id });

    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }, // <--- Don't forget this comma!

  // FIX: This one was already correct, but ensure it follows the comma
  async getMyActiveRequests(req, res) {
    try {
      const userId = req.user.uid;
      const requests = await HelpRequest.getByUser(userId);
      return BaseController.success(res, requests);
    } catch (error) {
      return BaseController.error(res, error.message);
    }
  },

  async getAllCenters(req, res) {
    try {
      const centers = await EvacuationCenter.getAllActive();
      return BaseController.success(res, centers);
    } catch (error) {
      return BaseController.error(res, error.message);
    }
  }
};