import { firestore } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

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

  // --- AVAILABLE HELP REQUESTS (Global Feed) ---
async getAvailableHelpRequests(req, res) {
    try {
        // Since the index is ENABLED, this query should now succeed.
        const requestsSnapshot = await firestore.collectionGroup('help_requests')
          .where('status', '==', 'Open') // <--- Data check needed here
          .get();

        const helpRequests = requestsSnapshot.docs.map(doc => {
            // This mapping must not fail if doc.ref.parent.parent is undefined.
            const organizationId = doc.ref.parent.parent ? doc.ref.parent.parent.id : 'unknown_org';
            return { id: doc.id, ...doc.data(), organizationId: organizationId };
        });
        
        // This is a CRITICAL debugging line: Check your server logs immediately after deployment.
        // If this logs 0, the issue is data criteria (Step 3).
        console.log(`SUCCESS: Total open help requests returned: ${helpRequests.length}`);

        return BaseController.success(res, helpRequests);
    } catch (error) { 
        console.error("FATAL LOGICAL ERROR AFTER INDEX BUILD:", error);
        // If the error is not indexing, the logic itself is failing.
        return BaseController.error(res, "Internal error during data mapping.", 500); 
    }
},

  // --- SELF ASSIGN (Claim a Help Request) ---
  async selfAssignToHelpRequest(req, res) {
    try {
      const userId = req.user.uid;
      const { orgId, helpRequestId } = req.body; 

      if (!orgId || !helpRequestId) return BaseController.error(res, "Organization ID and Help Request ID required", 400);

      // Reference the document using the database collection name 'needs'
      const requestRef = firestore.collection('organizations').doc(orgId).collection('needs').doc(helpRequestId);

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
          status: newCount >= requestData.volunteersNeeded ? 'Filled' : 'Open'
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