import { firestore } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

export const adminController = {
  async getAllVolunteers(req, res) {
    try {
      console.log('Fetching all volunteers...');  // Debug log
      
      const snapshot = await firestore.collection('users')
        .where('role', '==', 'volunteer')
        .get();
      
      if (snapshot.empty) {
        console.log('No matching volunteers found');
        return BaseController.success(res, []);
      }

      const volunteers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Found ${volunteers.length} volunteers`);  // Debug log
      return BaseController.success(res, volunteers);
    } catch (error) {
      console.error('Error in getAllVolunteers:', error);  // Debug log
      return BaseController.error(res, error.message);
    }
  }
};