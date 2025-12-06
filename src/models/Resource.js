import { firestore } from "../firebaseAdmin.js";

class Resource {
  constructor(data) {
    this.id = data.id || null;
    this.organizationId = data.organizationId;
    this.name = data.name;
    this.quantity = data.quantity || 0;
    this.unit = data.unit || 'pcs';
    this.updatedAt = data.updatedAt || new Date();
  }

  toFirestore() {
    return {
      name: this.name,
      quantity: this.quantity,
      unit: this.unit,
      updatedAt: new Date()
    };
  }

  static async create(orgId, data) {
    const ref = firestore.collection('organizations').doc(orgId).collection('resources').doc();
    await ref.set({ ...data, updatedAt: new Date() });
    return ref.id;
  }

  static async getByOrg(orgId) {
    const snap = await firestore.collection('organizations').doc(orgId).collection('resources').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // --- NEW METHODS ---
  static async update(orgId, resourceId, data) {
    await firestore.collection('organizations').doc(orgId)
      .collection('resources').doc(resourceId)
      .update({ ...data, updatedAt: new Date() });
  }

  static async delete(orgId, resourceId) {
    await firestore.collection('organizations').doc(orgId)
      .collection('resources').doc(resourceId).delete();
  }
}
export default Resource;