// citizenController.js
import { HelpRequest, EvacuationCenter } from "../models/index.js";
import { BaseController } from "./BaseController.js";
import { db } from "../firebaseAdmin.js"; 

// --- Database Path Constants ---
const ORGANIZATION_COLLECTION_NAME = 'organizations';
const HELP_REQUESTS_SUBCOLLECTION_NAME = 'help_requests'; 
const COMMUNITY_ORG_ID = 'community_requests'; 
const ROOT_LEVEL_COLLECTION_NAME = 'help_requests'; // Same as the subcollection name constant

export const citizenController = {
  
  // 1. CREATE REQUEST (Remains the same - writes correctly to subcollection)
  createRequest: async (req, res) => {
    try {
      // Destructure all incoming fields
      const { disasterId, type, description, details, location, status, volunteersAssigned, volunteersNeeded, coordinates } = req.body;
      
      // Define safe coordinate default
      const finalCoordinates = coordinates || { lat: 0, lng: 0 };
      const finalDescription = description || details || "No description provided";

      const helpRequestData = {
        disasterId: disasterId || null, 
        type,
        description: finalDescription, 
        location,
        coordinates: finalCoordinates, 
        status: status || 'Open', 
        volunteersAssigned: volunteersAssigned || 0,
        volunteersNeeded: volunteersNeeded || 1,
        createdAt: new Date(),
        requestedBy: req.user.uid,
        organization: 'Civilian Request',
        organizationId: COMMUNITY_ORG_ID
      };

      // Ensure the parent organization document exists
      const communityOrgRef = db.collection(ORGANIZATION_COLLECTION_NAME).doc(COMMUNITY_ORG_ID);
      await communityOrgRef.set({ name: 'Community Requests', type: 'Community' }, { merge: true });

      // Write the request to the SUBCOLLECTION
      const docRef = await communityOrgRef.collection(HELP_REQUESTS_SUBCOLLECTION_NAME).add(helpRequestData);

      return BaseController.success(res, { id: docRef.id, ...helpRequestData }, "Help Request successfully broadcasted.");

    } catch (error) {
      console.error("Error creating request:", error);
      return BaseController.error(res, error.message);
    }
  },

  // 2. RESOLVE REQUEST (Remains the same - handles both old root and new subcollection paths)
  async resolveRequest(req, res) {
    try {
        const requestId = req.params.requestId; 
        if (!requestId) {
            return BaseController.error(res, "Request ID is missing from URL.", 400);
        }

        // 1. Define the correct (new) subcollection reference
        const subcollectionRef = db.collection(ORGANIZATION_COLLECTION_NAME)
                            .doc(COMMUNITY_ORG_ID)
                            .collection(HELP_REQUESTS_SUBCOLLECTION_NAME)
                            .doc(requestId);

        // 2. Define the old (stale) root collection reference
        const rootRef = db.collection(ROOT_LEVEL_COLLECTION_NAME).doc(requestId);
        
        let requestRef;
        let docSnap = await subcollectionRef.get();

        // Check 1: Is it in the new (correct) subcollection?
        if (docSnap.exists) {
            requestRef = subcollectionRef;
        } else {
            // Check 2: Is it in the old (stale) root collection? (For backward compatibility)
            docSnap = await rootRef.get();
            if (docSnap.exists) {
                requestRef = rootRef;
            } else {
                // If not found in either, throw the error with the ID.
                throw new Error(`Help Request (ID: ${requestId}) not found in expected paths.`);
            }
        }
        
        // Update the status of the found document
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
  
  // 3. GET MY ACTIVE REQUESTS (NEW ROBUST IMPLEMENTATION)
  async getMyActiveRequests(req, res) {
    try {
      const userId = req.user.uid;
      let allRequests = [];

      // A. Query the new subcollection path
      const subcollectionSnap = await db.collection(ORGANIZATION_COLLECTION_NAME)
        .doc(COMMUNITY_ORG_ID)
        .collection(HELP_REQUESTS_SUBCOLLECTION_NAME)
        .where('requestedBy', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      allRequests = allRequests.concat(subcollectionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      // B. Query the old root collection path
      const rootSnap = await db.collection(ROOT_LEVEL_COLLECTION_NAME)
        .where('requestedBy', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      allRequests = allRequests.concat(rootSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      // Remove duplicates if any were somehow captured twice (e.g., if a document was moved)
      const uniqueRequests = allRequests.filter((request, index, self) => 
          index === self.findIndex(r => r.id === request.id)
      );

      return BaseController.success(res, uniqueRequests);

    } catch (error) {
      console.error("Error getting active requests:", error);
      return BaseController.error(res, "Failed to retrieve active requests: " + error.message);
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