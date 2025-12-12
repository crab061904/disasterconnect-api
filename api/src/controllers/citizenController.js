import { HelpRequest, EvacuationCenter } from "../models/index.js";
import { BaseController } from "./BaseController.js";
import { db } from "../firebaseAdmin.js"; 

// --- Database Path Constants ---
const ORGANIZATION_COLLECTION_NAME = 'organizations';
// This MUST be the exact subcollection name the volunteer portal's collectionGroup('help_requests') queries.
// We keep it as 'help_requests' to match the volunteer controller's global query,
// which is the standard setup for Collection Group.
const HELP_REQUESTS_SUBCOLLECTION_NAME = 'help_requests'; 
const COMMUNITY_ORG_ID = 'community_requests'; // The hardcoded virtual organization ID

export const citizenController = {
  
  // 1. CREATE REQUEST (Ensures immediate 'Open' status and correct path)
  createRequest: async (req, res) => {
    try {
      const { disasterId, type, description, details, location, status, volunteersAssigned, volunteersNeeded } = req.body;

      const helpRequestData = {
        disasterId: disasterId || null, 
        type,
        description: description || details || "No description provided",
        location,
        // Status is 'Open' immediately for volunteer visibility
        status: status || 'Open', 
        volunteersAssigned: volunteersAssigned || 0,
        volunteersNeeded: volunteersNeeded || 1,
        createdAt: new Date(),
        requestedBy: req.user.uid,
        organization: 'Civilian Request',
        organizationId: COMMUNITY_ORG_ID // Virtual Organization ID
      };

      // 1. Ensure the virtual parent organization document exists
      const communityOrgRef = db.collection(ORGANIZATION_COLLECTION_NAME).doc(COMMUNITY_ORG_ID);
      await communityOrgRef.set({ name: 'Community Requests', type: 'Community' }, { merge: true });

      // 2. Write the request to the correct SUBCOLLECTION ('help_requests')
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
        // Request ID is expected from the URL parameter (e.g., /requests/:requestId/resolve)
        const requestId = req.params.requestId; 
        
        if (!requestId) {
            return BaseController.error(res, "Request ID is missing from URL.", 400);
        }

        // Find the document in the hardcoded virtual organization path
        const requestRef = db.collection(ORGANIZATION_COLLECTION_NAME)
                            .doc(COMMUNITY_ORG_ID)
                            .collection(HELP_REQUESTS_SUBCOLLECTION_NAME) // Consistent subcollection name
                            .doc(requestId);

        // Check for existence before updating (This is where the 'Not found' error was occurring)
        const docSnap = await requestRef.get();
        if (!docSnap.exists) {
            throw new Error(`Help Request not found at path: ${requestRef.path}`);
        }

        await requestRef.update({
            status: 'Closed', // Marks the status as resolved
            resolvedByCitizen: true,
            updatedAt: new Date()
        });

        return BaseController.success(res, { requestId, status: 'Closed' }, "Help request resolved and closed.");

    } catch (error) {
        console.error("Error resolving request:", error);
        return BaseController.error(res, error.message, 500); 
    }
  },
  
  // 3. GET MY ACTIVE REQUESTS
  async getMyActiveRequests(req, res) {
    try {
      const userId = req.user.uid;
      // NOTE: Assuming HelpRequest.getByUser correctly queries based on the requestedBy field
      const requests = await HelpRequest.getByUser(userId); 
      return BaseController.success(res, requests);
    } catch (error) {
      return BaseController.error(res, error.message);
    }
  },

  // 4. GET ALL CENTERS
  async getAllCenters(req, res) {
    try {
      const centers = await EvacuationCenter.getAllActive();
      return BaseController.success(res, centers);
    } catch (error) {
      return BaseController.error(res, error.message);
    }
  }
};