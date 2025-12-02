import { firestore } from "../firebaseAdmin.js";

/**
 * EvacuationCenter Model
 * Collection: organizations/{orgId}/centers
 */
class EvacuationCenter {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.address = data.address;
    this.head = data.head; // Person in charge
    this.contact = data.contact;
    this.capacity = data.capacity || 0;
    this.occupied = data.occupied || 0;
    this.lat = data.lat; // Latitude
    this.lon = data.lon; // Longitude
    this.organizationId = data.organizationId; // Reference to parent organization
    this.facilities = data.facilities || []; // e.g., ["medical", "food", "shelter"]
    this.status = data.status || "Operational"; // "Operational", "Full", "Closed"
    this.notes = data.notes || "";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toFirestore() {
    return {
      name: this.name,
      address: this.address,
      head: this.head,
      contact: this.contact,
      capacity: this.capacity,
      occupied: this.occupied,
      lat: this.lat,
      lon: this.lon,
      organizationId: this.organizationId,
      facilities: this.facilities,
      status: this.status,
      notes: this.notes,
      updatedAt: new Date()
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new EvacuationCenter({ ...data, id: doc.id });
  }

  // Create a new evacuation center
  static async create(orgId, centerData) {
    const centerRef = firestore
      .collection('organizations')
      .doc(orgId)
      .collection('centers')
      .doc();
    
    const center = new EvacuationCenter({
      ...centerData,
      organizationId: orgId,
      createdAt: new Date()
    });
    
    await centerRef.set(center.toFirestore());
    return centerRef.id;
  }

  // Get center by ID
  static async getById(orgId, centerId) {
    const doc = await firestore
      .collection('organizations')
      .doc(orgId)
      .collection('centers')
      .doc(centerId)
      .get();
    
    if (!doc.exists) return null;
    return EvacuationCenter.fromFirestore(doc);
  }

  // Get all centers for an organization
  static async getAllByOrganization(orgId, filters = {}) {
    let query = firestore
      .collection('organizations')
      .doc(orgId)
      .collection('centers');
    
    // Apply filters if provided
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => EvacuationCenter.fromFirestore(doc));
  }

  // Update center capacity
  async updateCapacity(change) {
    const centerRef = firestore
      .collection('organizations')
      .doc(this.organizationId)
      .collection('centers')
      .doc(this.id);
    
    const newOccupied = this.occupied + change;
    
    await centerRef.update({
      occupied: newOccupied,
      status: newOccupied >= this.capacity ? 'Full' : 'Operational',
      updatedAt: new Date()
    });
    
    this.occupied = newOccupied;
    this.status = newOccupied >= this.capacity ? 'Full' : 'Operational';
  }

  // Update center information
  async update(updateData) {
    const centerRef = firestore
      .collection('organizations')
      .doc(this.organizationId)
      .collection('centers')
      .doc(this.id);
    
    await centerRef.update({
      ...updateData,
      updatedAt: new Date()
    });
  }

  // Delete center
  async delete() {
    const centerRef = firestore
      .collection('organizations')
      .doc(this.organizationId)
      .collection('centers')
      .doc(this.id);
    
    await centerRef.delete();
  }

  // Get available capacity
  getAvailableSpace() {
    return Math.max(0, this.capacity - this.occupied);
  }
}

export default EvacuationCenter;
