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

  // --- OPEN NEEDS (Global Feed) ---
  async getOpenNeeds(req, res) {
    try {
      // Collection Group Query: Finds 'needs' across ALL organizations
      const needsSnapshot = await firestore.collectionGroup('needs')
        .where('status', '==', 'Open')
        .get();

      const needs = needsSnapshot.docs.map(doc => {
        // We get the orgId from the parent document path
        return { id: doc.id, ...doc.data(), orgId: doc.ref.parent.parent.id };
      });

      return BaseController.success(res, needs);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // --- SELF ASSIGN (Claim a Need) ---
  async selfAssign(req, res) {
    try {
      const userId = req.user.uid;
      const { orgId, needId } = req.body;

      if (!orgId || !needId) return BaseController.error(res, "Organization ID and Need ID required", 400);

      const needRef = firestore.collection('organizations').doc(orgId).collection('needs').doc(needId);

      // Transaction to prevent over-subscribing
      await firestore.runTransaction(async (t) => {
        const needDoc = await t.get(needRef);
        if (!needDoc.exists) throw new Error("Need not found");

        const needData = needDoc.data();
        if (needData.status !== 'Open') throw new Error("Task no longer open");
        if (needData.volunteersAssigned >= needData.volunteersNeeded) throw new Error("Task is full");

        // Increment count
        const newCount = (needData.volunteersAssigned || 0) + 1;
        t.update(needRef, { 
          volunteersAssigned: newCount,
          status: newCount >= needData.volunteersNeeded ? 'Filled' : 'Open'
        });

        // Add to Volunteer's assignments
        const assignmentRef = firestore.collection('volunteers').doc(userId).collection('assignments').doc();
        t.set(assignmentRef, {
          title: needData.title,
          description: needData.description || "Self-assigned task",
          organizationId: orgId,
          sourceNeedId: needId,
          status: "In Progress",
          assignedDate: new Date(),
          isSelfAssigned: true
        });
      });

      return BaseController.success(res, { needId, status: "Assigned" }, "You have volunteered for this task!");
    } catch (error) { return BaseController.error(res, error.message); }
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