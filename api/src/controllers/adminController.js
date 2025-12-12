// api/src/controllers/adminController.js
import { firestore } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

export const adminController = {
  async getAllVolunteers(req, res) {
    try {
      const snapshot = await firestore.collection('users')
        .where('role', '==', 'volunteer')
        .get();
      
      const volunteers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return BaseController.success(res, volunteers);
    } catch (error) {
      return BaseController.error(res, error.message);
    }
  }
};