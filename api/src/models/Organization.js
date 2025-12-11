// ✅ FIX: Import 'db' (matches your recent firebaseAdmin.js update)
import { db } from "../firebaseAdmin.js";

/**
 * Organization Model
 * Collection: organizations
 */
class Organization {
  constructor(data) {
    // ✅ FIX: Default ALL fields to null or empty types to prevent Firestore "undefined" crash
    this.id = data.id || null;
    this.name = data.name || null; // <--- This was crashing your app
    this.type = data.type || "organization"; 
    this.description = data.description || "";
    this.email = data.email || null;
    this.phone = data.phone || "";
    this.website = data.website || "";
    this.logo = data.logo || "";
    
    // Ensure nested objects are handled safely
    this.location = data.location || { lat: null, lng: null, address: "" };
    
    this.serviceArea = Array.isArray(data.serviceArea) ? data.serviceArea : [];
    this.resources = Array.isArray(data.resources) ? data.resources : [];
    
    this.adminUid = data.adminUid || null;
    this.members = Array.isArray(data.members) ? data.members : [];
    
    this.isVerified = data.isVerified === true; // Strict boolean check
    
    // Handle dates safely
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  toFirestore() {
    return {
      name: this.name,
      type: this.type,
      description: this.description,
      email: this.email,
      phone: this.phone,
      website: this.website,
      logo: this.logo,
      location: this.location,
      serviceArea: this.serviceArea,
      resources: this.resources,
      adminUid: this.adminUid,
      members: this.members,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Organization({ ...data, id: doc.id });
  }

  async save() {
    this.updatedAt = new Date();
    const data = this.toFirestore();

    // Use 'db' instead of 'firestore'
    if (this.id) {
      await db.collection("organizations").doc(this.id).set(data, { merge: true });
    } else {
      const docRef = await db.collection("organizations").add(data);
      this.id = docRef.id;
    }
    return this;
  }

  static async getById(id) {
    const doc = await db.collection("organizations").doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return Organization.fromFirestore(doc);
  }

  static async getByType(type, limit = 20) {
    const snapshot = await db
      .collection("organizations")
      .where("type", "==", type)
      .where("isVerified", "==", true)
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => Organization.fromFirestore(doc));
  }

  async addMember(userUid) {
    if (!this.members.includes(userUid)) {
      this.members.push(userUid);
      await this.save();
    }
  }

  async removeMember(userUid) {
    this.members = this.members.filter((uid) => uid !== userUid);
    await this.save();
  }

  async delete() {
    if (!this.id) throw new Error("Cannot delete organization without ID");
    await db.collection("organizations").doc(this.id).delete();
  }
}

export default Organization;