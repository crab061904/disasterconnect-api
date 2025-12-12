import { firestore } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

// --- Database Collection Name Constant ---
// NOTE: Use the correct subcollection name confirmed in your database
const HELP_REQUESTS_COLLECTION_NAME = 'help_requests'; 

export const volunteerController = {
  
  // --- AVAILABILITY ---
  async setAvailability(req, res) {
    try {
      const userId = req.user.uid;
      const { date, status, startTime, endTime } = req.body;
      
      const availabilityData = {
        date: date ? new Date(date) : new Date(),
        status: status || "Available",
        startTime: startTime || "",
        endTime: endTime || "",
        createdAt: new Date()
      };

      const docRef = await firestore.collection('volunteers').doc(userId).collection('availability').add(availabilityData);
      
      return BaseController.success(res, { id: docRef.id, ...availabilityData }, "Availability updated");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async getMyAvailability(req, res) {
    try {
      const userId = req.user.uid;
      const snap = await firestore.collection('volunteers').doc(userId).collection('availability').orderBy('date', 'desc').get();
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, data);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // --- ASSIGNMENTS (My Tasks) ---
  async getAssignments(req, res) {
    try {
      const userId = req.user.uid;
      // Get tasks assigned specifically to me
      const snap = await firestore.collection('volunteers').doc(userId).collection('assignments')
        .where('status', 'in', ['Pending', 'In Progress'])
        .get();

      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, data);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async updateAssignmentStatus(req, res) {
    // NOTE: This function is used for general status updates, but we will use the new
    // `completeAssignment` function below for final resolution of a Help Request.
    try {
      const userId = req.user.uid;
      const { assignmentId } = req.params;
      const { status } = req.body; 

      if (!status) return BaseController.error(res, "Status is required", 400);

      await firestore.collection('volunteers').doc(userId).collection('assignments').doc(assignmentId)
        .update({ status, updatedAt: new Date() });

      return BaseController.success(res, { assignmentId, status }, "Assignment updated");
    } catch (error) { return BaseController.error(res, error.message); }
  },
  
  // ⭐ NEW FUNCTION: Complete Assignment and Close Help Request (Fulfilled Loop)
  async completeAssignment(req, res) {
    const userId = req.user.uid;
    const { assignmentId, helpRequestId, orgId } = req.body;

    if (!assignmentId || !helpRequestId || !orgId) {
        return BaseController.error(res, "Missing assignment, help request, or organization IDs.", 400);
    }
    
    // 1. References for the transaction
    const assignmentRef = firestore.collection('volunteers').doc(userId).collection('assignments').doc(assignmentId);
    
    // The original Help Request document that the civilian is tracking
    const helpRequestRef = firestore.collection('organizations').doc(orgId).collection(HELP_REQUESTS_COLLECTION_NAME).doc(helpRequestId);

    try {
        await firestore.runTransaction(async (t) => {
            
            // Check if the request exists
            const requestDoc = await t.get(helpRequestRef);
            if (!requestDoc.exists) throw new Error("Original Help Request not found.");

            // 2. Mark Volunteer Assignment as Completed
            t.update(assignmentRef, { 
                status: 'Completed', 
                completionDate: new Date(),
                completedBy: userId
            });

            // 3. Mark Original Help Request as Closed (This resolves the Civilian's need)
            t.update(helpRequestRef, { 
                status: 'Closed', 
                closedByVolunteer: true, // Flag for tracking source of closure
                closedDate: new Date() 
            });
            
            // NOTE: The Civilian Dashboard logic (CitizenDashboard.tsx) now checks for 
            // active requests. When the status changes to 'Closed', the civilian is 
            // implicitly marked "Safe" / "No active requests."
        });

        return BaseController.success(res, { assignmentId, helpRequestId }, "Assignment successfully completed and Help Request closed.");

    } catch (error) {
        console.error("Transaction failed during assignment completion:", error);
        return BaseController.error(res, error.message);
    }
  },


  // --- AVAILABLE HELP REQUESTS (Global Feed) ---
  async getAvailableHelpRequests(req, res) {
    try {
      // NOTE: This Collection Group query requires a Collection Group Index on 'help_requests' with 'status' field.
      
      const requestsSnapshot = await firestore.collectionGroup(HELP_REQUESTS_COLLECTION_NAME)
        .where('status', '==', 'Open')
        .get();

      const helpRequests = requestsSnapshot.docs.map(doc => {
        // Safely retrieve the parent ID (Organization ID)
        const organizationId = doc.ref.parent?.parent?.id || 'unknown_org'; 
        const data = doc.data();

        return { 
            id: doc.id, 
          // Safely map required fields
            title: data.title || 'Untitled Request', 
            organizationId: organizationId,
            ...data 
        };
      });
      
      return BaseController.success(res, helpRequests);
    } catch (error) { 
        console.error("Firestore Error (getAvailableHelpRequests):", error);
        // Return a 500 error with a specific message for debugging
        return BaseController.error(res, "Failed to retrieve help requests. Check Firebase logs for missing index.", 500); 
    }
  },

  // --- SELF ASSIGN (Claim a Help Request) ---
  async selfAssignToHelpRequest(req, res) {
    try {
      const userId = req.user.uid;
      const { orgId, helpRequestId } = req.body; 

      if (!orgId || !helpRequestId) return BaseController.error(res, "Organization ID and Help Request ID required", 400);

      // ⭐ CRITICAL FIX: Use correct collection name (help_requests)
      const requestRef = firestore.collection('organizations').doc(orgId).collection(HELP_REQUESTS_COLLECTION_NAME).doc(helpRequestId);

      // Transaction to prevent over-subscribing
      await firestore.runTransaction(async (t) => {
        const requestDoc = await t.get(requestRef);
        if (!requestDoc.exists) throw new Error("Help Request not found");

        const requestData = requestDoc.data();
        if (requestData.status !== 'Open') throw new Error("Request no longer open");
        if (requestData.volunteersAssigned >= requestData.volunteersNeeded) throw new Error("Request is full");

        // Increment count
        const newCount = (requestData.volunteersAssigned || 0) + 1;
        t.update(requestRef, { 
          volunteersAssigned: newCount,
          // Set assignment status to 'In Progress' immediately on the Help Request side
          status: 'In Progress' 
        });

        // Add to Volunteer's assignments
        const assignmentRef = firestore.collection('volunteers').doc(userId).collection('assignments').doc();
        t.set(assignmentRef, {
          title: requestData.title,
          description: requestData.description || "Self-assigned task",
          organizationId: orgId,
          sourceRequestId: helpRequestId,
          status: "In Progress",
          assignedDate: new Date(),
          isSelfAssigned: true
        });
      });

      return BaseController.success(res, { helpRequestId, status: "Assigned" }, "You have volunteered for this request!");
    } catch (error) { return BaseController.error(res, error.message); }
  },
    
  // --- LINKED ORGANIZATIONS (Fixes 404 on frontend fetch) ---
  async getLinkedOrganizations(req, res) {
    try {
        const userId = req.user.uid;
        
        // NOTE: This collection may not exist yet, but providing a successful response fixes the 404.
        const snap = await firestore.collection('volunteers').doc(userId).collection('linkedOrganizations').get();
        
        const organizations = snap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        return BaseController.success(res, organizations, "Linked organizations retrieved.");
    } catch (error) { 
        return BaseController.error(res, error.message); 
    }
  },

  // --- MISSIONS (History) ---
  async getMissionHistory(req, res) {
    try {
      const userId = req.user.uid;
      const snap = await firestore.collection('volunteers').doc(userId).collection('missions').orderBy('endDate', 'desc').get();
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, data);
    } catch (error) { return BaseController.error(res, error.message); }
  }
};