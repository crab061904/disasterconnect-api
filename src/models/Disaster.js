import { firestore } from "../firebaseAdmin.js";

/**
 * Disaster Model
 * Collection: disasters
 */
class Disaster {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type; // earthquake, flood, fire, typhoon, etc.
    this.severity = data.severity; // low, medium, high, critical
    this.status = data.status || "active"; // active, resolved, monitoring
    this.location = data.location; // { lat, lng, address, city, region }
    this.affectedArea = data.affectedArea || null; // radius in km or polygon
    this.reportedBy = data.reportedBy; // user uid
    this.verifiedBy = data.verifiedBy || null; // admin/authority uid
    this.isVerified = data.isVerified || false;
    this.images = data.images || []; // array of image URLs
    this.casualties = data.casualties || { injured: 0, deceased: 0, missing: 0 };
    this.needsHelp = data.needsHelp || []; // array of needed resources
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toFirestore() {
    return {
      title: this.title,
      description: this.description,
      type: this.type,
      severity: this.severity,
      status: this.status,
      location: this.location,
      affectedArea: this.affectedArea,
      reportedBy: this.reportedBy,
      verifiedBy: this.verifiedBy,
      isVerified: this.isVerified,
      images: this.images,
      casualties: this.casualties,
      needsHelp: this.needsHelp,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Disaster({ ...data, id: doc.id });
  }

  async save() {
    this.updatedAt = new Date();
    const data = this.toFirestore();

    if (this.id) {
      // Update existing
      await firestore.collection("disasters").doc(this.id).set(data, { merge: true });
    } else {
      // Create new
      const docRef = await firestore.collection("disasters").add(data);
      this.id = docRef.id;
    }
    return this;
  }

  static async getById(id) {
    const doc = await firestore.collection("disasters").doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return Disaster.fromFirestore(doc);
  }

  // Get disasters by location (within radius)
  static async getByLocation(lat, lng, radiusKm = 50) {
    // Note: For production, use geohash or GeoFirestore for efficient geo queries
    const snapshot = await firestore
      .collection("disasters")
      .where("status", "==", "active")
      .get();

    return snapshot.docs
      .map((doc) => Disaster.fromFirestore(doc))
      .filter((disaster) => {
        const distance = calculateDistance(
          lat,
          lng,
          disaster.location.lat,
          disaster.location.lng
        );
        return distance <= radiusKm;
      });
  }

  // Get disasters by type
  static async getByType(type, limit = 20) {
    const snapshot = await firestore
      .collection("disasters")
      .where("type", "==", type)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => Disaster.fromFirestore(doc));
  }

  // Get active disasters
  static async getActive(limit = 20) {
    const snapshot = await firestore
      .collection("disasters")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => Disaster.fromFirestore(doc));
  }

  async delete() {
    if (!this.id) throw new Error("Cannot delete disaster without ID");
    await firestore.collection("disasters").doc(this.id).delete();
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default Disaster;
