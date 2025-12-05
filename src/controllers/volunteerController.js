import { firestore } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

export const volunteerController = {
  
  // --- AVAILABILITY ---
  async setAvailability(req, res) {
    try {
      const userId = req.user.uid;
      const { date, status, startTime, endTime } = req.body;
      
      // 1. Construct the data object first
      const availabilityData = {
        date: date ? new Date(date) : new Date(),
        status: status || "Available", // Default to "Available"
        startTime: startTime || "",
        endTime: endTime || "",
        createdAt: new Date()
      };

      // 2. Save to Firestore and capture the reference
      const docRef = await firestore
        .collection('volunteers')
        .doc(userId)
        .collection('availability')
        .add(availabilityData);
      
      // 3. Return the ID and the Data (Fixes the "data: null" issue)
      return BaseController.success(res, { 
        id: docRef.id, 
        ...availabilityData 
      }, "Availability updated");

    } catch (error) { 
      return BaseController.error(res, error.message); 
    }
  },

  async getMyAvailability(req, res) {
    try {
      const userId = req.user.uid;
      
      // Added orderBy to show newest dates first
      const snap = await firestore
        .collection('volunteers')
        .doc(userId)
        .collection('availability')
        .orderBy('date', 'desc') 
        .get();

      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, data);
    } catch (error) { 
      return BaseController.error(res, error.message); 
    }
  },

  // --- ASSIGNMENTS ---
  async getAssignments(req, res) {
    try {
      const userId = req.user.uid;
      const snap = await firestore
        .collection('volunteers')
        .doc(userId)
        .collection('assignments')
        .where('status', 'in', ['Pending', 'In Progress'])
        .get();

      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, data);
    } catch (error) { 
      return BaseController.error(res, error.message); 
    }
  },

  async updateAssignmentStatus(req, res) {
    try {
      const userId = req.user.uid;
      const { assignmentId } = req.params;
      const { status } = req.body; // "Completed", "In Progress"

      if (!status) {
        return BaseController.error(res, "Status is required", 400);
      }

      await firestore
        .collection('volunteers')
        .doc(userId)
        .collection('assignments')
        .doc(assignmentId)
        .update({ status, updatedAt: new Date() });

      // Return the updated status so frontend knows it succeeded
      return BaseController.success(res, { assignmentId, status }, "Assignment updated");
    } catch (error) { 
      return BaseController.error(res, error.message); 
    }
  },

  // --- MISSIONS (History) ---
  async getMissionHistory(req, res) {
    try {
      const userId = req.user.uid;
      const snap = await firestore
        .collection('volunteers')
        .doc(userId)
        .collection('missions')
        .orderBy('endDate', 'desc') // Show most recent missions first
        .get();

      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, data);
    } catch (error) { 
      return BaseController.error(res, error.message); 
    }
  }
};