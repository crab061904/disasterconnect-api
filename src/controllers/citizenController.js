// src/controllers/citizenController.js
import { HelpRequest, EvacuationCenter } from "../models/index.js";
import { BaseController } from "./BaseController.js";

export const citizenController = {
  // POST /api/citizen/requests
  async createRequest(req, res) {
    try {
      const { type, location, details } = req.body;
      const userId = req.user.uid;

      const request = new HelpRequest({
        requestedBy: userId,
        type: type || "other",
        location: { address: location, lat: null, lng: null },
        description: details || "Emergency assistance requested",
        status: "pending",
        urgency: "high",
        contactInfo: {},
        images: [],
        createdAt: new Date()
      });

      await request.save();
      return BaseController.success(res, request, "Help request submitted", 201);
    } catch (error) {
      return BaseController.error(res, error.message);
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