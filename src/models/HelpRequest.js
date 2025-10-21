import { firestore } from "../firebaseAdmin.js";

/**
 * HelpRequest Model
 * Collection: help_requests
 * For people requesting help during disasters
 */
class HelpRequest {
  constructor(data) {
    this.id = data.id || null;
    this.disasterId = data.disasterId; // reference to disaster
    this.requestedBy = data.requestedBy; // user uid
    this.title = data.title;
    this.description = data.description;
    this.urgency = data.urgency; // low, medium, high, critical
    this.status = data.status || "pending"; // pending, in_progress, fulfilled, cancelled
    this.type = data.type; // rescue, medical, food, water, shelter, etc.
    this.location = data.location; // { lat, lng, address }
    this.contactInfo = data.contactInfo; // { phone, alternateContact }
    this.numberOfPeople = data.numberOfPeople || 1;
    this.assignedTo = data.assignedTo || null; // organization or volunteer uid
    this.images = data.images || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.fulfilledAt = data.fulfilledAt || null;
  }

  toFirestore() {
    return {
      disasterId: this.disasterId,
      requestedBy: this.requestedBy,
      title: this.title,
      description: this.description,
      urgency: this.urgency,
      status: this.status,
      type: this.type,
      location: this.location,
      contactInfo: this.contactInfo,
      numberOfPeople: this.numberOfPeople,
      assignedTo: this.assignedTo,
      images: this.images,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      fulfilledAt: this.fulfilledAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new HelpRequest({ ...data, id: doc.id });
  }

  async save() {
    this.updatedAt = new Date();
    const data = this.toFirestore();

    if (this.id) {
      await firestore.collection("help_requests").doc(this.id).set(data, { merge: true });
    } else {
      const docRef = await firestore.collection("help_requests").add(data);
      this.id = docRef.id;
    }
    return this;
  }

  static async getById(id) {
    const doc = await firestore.collection("help_requests").doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return HelpRequest.fromFirestore(doc);
  }

  // Get help requests by disaster
  static async getByDisaster(disasterId, limit = 50) {
    const snapshot = await firestore
      .collection("help_requests")
      .where("disasterId", "==", disasterId)
      .orderBy("urgency", "desc")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => HelpRequest.fromFirestore(doc));
  }

  // Get pending help requests
  static async getPending(limit = 50) {
    const snapshot = await firestore
      .collection("help_requests")
      .where("status", "==", "pending")
      .orderBy("urgency", "desc")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => HelpRequest.fromFirestore(doc));
  }

  // Assign help request to volunteer/organization
  async assignTo(assigneeUid) {
    this.assignedTo = assigneeUid;
    this.status = "in_progress";
    await this.save();
  }

  // Mark as fulfilled
  async markFulfilled() {
    this.status = "fulfilled";
    this.fulfilledAt = new Date();
    await this.save();
  }

  async delete() {
    if (!this.id) throw new Error("Cannot delete help request without ID");
    await firestore.collection("help_requests").doc(this.id).delete();
  }
}

export default HelpRequest;
