import { firestore } from "../firebaseAdmin.js";

/**
 * Announcement Model
 * Collection: organizations/{orgId}/announcements
 */
class Announcement {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title;
    this.body = data.body;
    this.status = data.status || "Draft"; // "Published" | "Draft"
    this.date = data.date || new Date();
    this.createdBy = data.createdBy; // User ID who created the announcement
    this.organizationId = data.organizationId; // Reference to parent organization
  }

  toFirestore() {
    return {
      title: this.title,
      body: this.body,
      status: this.status,
      date: this.date,
      createdBy: this.createdBy,
      organizationId: this.organizationId,
      updatedAt: new Date()
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Announcement({ ...data, id: doc.id });
  }

  // Create a new announcement
  static async create(orgId, announcementData) {
    const announcementRef = firestore
      .collection('organizations')
      .doc(orgId)
      .collection('announcements')
      .doc();
    
    const announcement = new Announcement({
      ...announcementData,
      organizationId: orgId
    });
    
    await announcementRef.set(announcement.toFirestore());
    return announcementRef.id;
  }

  // Get announcement by ID
  static async getById(orgId, announcementId) {
    const doc = await firestore
      .collection('organizations')
      .doc(orgId)
      .collection('announcements')
      .doc(announcementId)
      .get();
    
    if (!doc.exists) return null;
    return Announcement.fromFirestore(doc);
  }

  // Get all announcements for an organization
  static async getAllByOrganization(orgId, status = null) {
    let query = firestore
      .collection('organizations')
      .doc(orgId)
      .collection('announcements');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => Announcement.fromFirestore(doc));
  }

  // Update an announcement
  async update(updateData) {
    const announcementRef = firestore
      .collection('organizations')
      .doc(this.organizationId)
      .collection('announcements')
      .doc(this.id);
    
    await announcementRef.update({
      ...updateData,
      updatedAt: new Date()
    });
  }

  // Delete an announcement
  async delete() {
    const announcementRef = firestore
      .collection('organizations')
      .doc(this.organizationId)
      .collection('announcements')
      .doc(this.id);
    
    await announcementRef.delete();
  }
}

export default Announcement;
