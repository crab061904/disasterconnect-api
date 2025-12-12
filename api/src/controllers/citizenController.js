import { HelpRequest, EvacuationCenter } from "../models/index.js";
import { BaseController } from "./BaseController.js";
import { db } from "../firebaseAdmin.js"; 

// --- Database Path Constants ---
const ORGANIZATION_COLLECTION_NAME = 'organizations';
const HELP_REQUESTS_SUBCOLLECTION_NAME = 'help_requests';
const COMMUNITY_ORG_ID = 'community_requests'; 

export const citizenController = {
  
  // 1. CREATE REQUEST (Sets status to 'Open' immediately)
  createRequest: async (req, res) => {
    try {
      const { disasterId, type, description, details, location, status, volunteersAssigned, volunteersNeeded } = req.body;

      const helpRequestData = {
        disasterId: disasterId || null, 
        type,
        description: description || details || "No description provided",
        location,
        // ⭐ CRITICAL FIX: Ensure status is 'Open' for immediate volunteer visibility
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

      return BaseController.success(res, { id: docRef.id, ...helpRequestData }, "Help Request successfully broadcasted.");

    } catch (error) {
      console.error("Error creating request:", error);
      return BaseController.error(res, error.message);
    }
  },

  // 2. RESOLVE REQUEST (Closes the loop from the Civilian Dashboard)
  async resolveRequest(req, res) {
    try {
        // The request ID is passed via the URL parameter in the route definition
        const requestId = req.params.requestId; 
        
        if (!requestId) {
            return BaseController.error(res, "Request ID is missing from URL.", 400);
        }

        // Find the document in the correct subcollection path
        const requestRef = db.collection(ORGANIZATION_COLLECTION_NAME)
                            .doc(COMMUNITY_ORG_ID)
                            .collection(HELP_REQUESTS_SUBCOLLECTION_NAME)
                            .doc(requestId);

        // Check for existence before updating (prevents 5 NOT_FOUND error)
        const docSnap = await requestRef.get();
        if (!docSnap.exists) {
            throw new Error(`Help Request not found at path: ${requestRef.path}`);
        }

        await requestRef.update({
            status: 'Closed', // Marks the status as resolved, making the civilian "safe"
            resolvedByCitizen: true,
            updatedAt: new Date()
        });

        return BaseController.success(res, { requestId, status: 'Closed' }, "Help request resolved and closed.");

    } catch (error) {
        console.error("Error resolving request:", error);
        // This specific error helps the developer diagnose if the path is wrong
        return BaseController.error(res, error.message, 500); 
    }
  },
  
  async getMyActiveRequests(req, res) {
    try {
      const userId = req.user.uid;
      // NOTE: Assuming HelpRequest.getByUser queries the subcollections (e.g., uses Collection Group internally)
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