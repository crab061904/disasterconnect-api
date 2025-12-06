import { firestore } from "../firebaseAdmin.js";

class Report {
  static async create(orgId, data) {
    const ref = firestore.collection('organizations').doc(orgId).collection('reports').doc();
    await ref.set({
      title: data.title,
      author: data.author,
      status: data.status || 'Pending',
      date: new Date()
    });
    return ref.id;
  }

  static async getByOrg(orgId) {
    const snap = await firestore.collection('organizations').doc(orgId).collection('reports').orderBy('date', 'desc').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // --- NEW METHODS ---
  static async update(orgId, reportId, data) {
    await firestore.collection('organizations').doc(orgId)
      .collection('reports').doc(reportId)
      .update(data);
  }

  static async delete(orgId, reportId) {
    await firestore.collection('organizations').doc(orgId)
      .collection('reports').doc(reportId).delete();
  }
}
export default Report;