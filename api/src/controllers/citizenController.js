import { HelpRequest, EvacuationCenter } from "../models/index.js";
import { BaseController } from "./BaseController.js";
import { db } from "../firebaseAdmin.js"; 

// --- Database Path Constants ---
const ORGANIZATION_COLLECTION_NAME = 'organizations';

// ⭐ CRITICAL FIX: The name must be consistently changed to the correct subcollection name.
// Assuming your documents are actually saved under 'needs' in the database.
const HELP_REQUESTS_SUBCOLLECTION_NAME = 'needs'; 

const COMMUNITY_ORG_ID = 'community_requests'; 

export const citizenController = {
  
  // 1. CREATE REQUEST (Updates path to use the correct constant)
  createRequest: async (req, res) => {
    try {
      const { disasterId, type, description, details, location, status, volunteersAssigned, volunteersNeeded } = req.body;

      const helpRequestData = {
        disasterId: disasterId || null, 
        type,
        description: description || details || "No description provided",
        location,
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

      // 2. Write the request to the SUBCOLLECTION ('needs')
      const docRef = await communityOrgRef.collection(HELP_REQUESTS_SUBCOLLECTION_NAME).add(helpRequestData);

      return BaseController.success(res, { id: docRef.id, ...helpRequestData }, "Help Request successfully broadcasted.");

    } catch (error) {
      console.error("Error creating request:", error);
      return BaseController.error(res, error.message);
    }
  },

  // 2. RESOLVE REQUEST (Fixes the lookup path)
  async resolveRequest(req, res) {
    try {
        // Grab ID from URL params
        const requestId = req.params.requestId; 
        
        if (!requestId) {
            return BaseController.error(res, "Request ID is missing from URL.", 400);
        }

        // Find the document in the CORRECT subcollection path ('needs')
        const requestRef = db.collection(ORGANIZATION_COLLECTION_NAME)
                            .doc(COMMUNITY_ORG_ID)
                            .collection(HELP_REQUESTS_SUBCOLLECTION_NAME) // <-- NOW POINTS TO 'needs'
                            .doc(requestId);

        // Check for existence before updating
        const docSnap = await requestRef.get();
        if (!docSnap.exists) {
            // Include a helpful error if it fails
            throw new Error(`Help Request not found at expected path: ${requestRef.path}`);
        }

        await requestRef.update({
            status: 'Closed', 
            resolvedByCitizen: true,
            updatedAt: new Date()
        });

        return BaseController.success(res, { requestId, status: 'Closed' }, "Help request resolved and closed.");

    } catch (error) {
        console.error("Error resolving request:", error);
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