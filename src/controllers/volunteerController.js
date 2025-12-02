import { firestore } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

export const volunteerController = {
  
  // --- AVAILABILITY ---
  async setAvailability(req, res) {
    try {
      const userId = req.user.uid;
      const { date, status, startTime, endTime } = req.body;
      
      await firestore.collection('volunteers').doc(userId).collection('availability').add({
        date: date ? new Date(date) : new Date(),
        status, // "Available" | "Unavailable"
        startTime,
        endTime,
        createdAt: new Date()
      });
      
      return BaseController.success(res, null, "Availability updated");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async getMyAvailability(req, res) {
    try {
      const userId = req.user.uid;
      const snap = await firestore.collection('volunteers').doc(userId).collection('availability').get();
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, data);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // --- ASSIGNMENTS ---
  async getAssignments(req, res) {
    try {
      const userId = req.user.uid;
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
      const { status } = req.body; // "Completed", "In Progress"

      await firestore.collection('volunteers').doc(userId)
        .collection('assignments').doc(assignmentId)
        .update({ status, updatedAt: new Date() });

      return BaseController.success(res, null, "Assignment updated");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // --- MISSIONS (History) ---
  async getMissionHistory(req, res) {
    try {
      const userId = req.user.uid;
      const snap = await firestore.collection('volunteers').doc(userId).collection('missions').get();
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, data);
    } catch (error) { return BaseController.error(res, error.message); }
  }
};