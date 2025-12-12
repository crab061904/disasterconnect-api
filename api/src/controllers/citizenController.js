import { HelpRequest, EvacuationCenter } from "../models/index.js";
import { BaseController } from "./BaseController.js";
import { db } from "../firebaseAdmin.js"; 

// --- Database Path Constants ---
const ORGANIZATION_COLLECTION_NAME = 'organizations';
const HELP_REQUESTS_SUBCOLLECTION_NAME = 'help_requests';
const COMMUNITY_ORG_ID = 'community_requests'; 

export const citizenController = {
  
  // ⭐ FIX APPLIED HERE: Prioritize the status sent by the client ('Open')
  createRequest: async (req, res) => {
    try {
      console.log("Create Request Body:", req.body); 

      const { disasterId, type, description, details, location, status, volunteersAssigned, volunteersNeeded } = req.body;

      const helpRequestData = {
        disasterId: disasterId || null, 
        type,
        description: description || details || "No description provided",
        location,
        // ⭐ CRITICAL FIX: Use 'Open' if status is provided, otherwise default to 'Open'.
        // This ensures the request is immediately visible to volunteers.
        status: status || 'Open', 
        volunteersAssigned: volunteersAssigned || 0,
        volunteersNeeded: volunteersNeeded || 1,
        createdAt: new Date(),
        requestedBy: req.user.uid,
        organization: 'Civilian Request',
        organizationId: COMMUNITY_ORG_ID
      };

      // 1. Ensure the parent organization document exists
      const communityOrgRef = db.collection(ORGANIZATION_COLLECTION_NAME).doc(COMMUNITY_ORG_ID);
      await communityOrgRef.set({ name: 'Community Requests', type: 'Community' }, { merge: true });

      // 2. Write the request to the SUBCOLLECTION
      const docRef = await communityOrgRef.collection(HELP_REQUESTS_SUBCOLLECTION_NAME).add(helpRequestData);

      BaseController.success(res, { id: docRef.id, ...helpRequestData }, "Help Request successfully broadcasted.");

    } catch (error) {
      console.error("Error creating request:", error);
      return BaseController.error(res, error.message);
    }
  },

  // --- NEW FUNCTION: Resolve/Close a request from the civilian side ---
  async resolveRequest(req, res) {
    try {
        const userId = req.user.uid;
        // The frontend sends the request ID via params/body, but we rely on the ID being in the URL path.
        const requestId = req.params.requestId || req.body.requestId; 
        
        if (!requestId) {
            return BaseController.error(res, "Request ID is missing.", 400);
        }

        const requestRef = db.collection(ORGANIZATION_COLLECTION_NAME)
                            .doc(COMMUNITY_ORG_ID)
                            .collection(HELP_REQUESTS_SUBCOLLECTION_NAME)
                            .doc(requestId);

        await requestRef.update({
            status: 'Closed',
            resolvedByCitizen: true,
            updatedAt: new Date()
        });

        return BaseController.success(res, { requestId, status: 'Closed' }, "Help request resolved and closed.");

    } catch (error) {
        console.error("Error resolving request:", error);
        return BaseController.error(res, error.message);
    }
  },
  
  async getMyActiveRequests(req, res) {
    try {
      const userId = req.user.uid;
      // NOTE: Assuming HelpRequest.getByUser is now smart enough to query the subcollections
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