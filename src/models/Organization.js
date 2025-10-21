import { firestore } from "../firebaseAdmin.js";

/**
 * Organization Model
 * Collection: organizations
 * For NGOs, government agencies, rescue teams, etc.
 */
class Organization {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.type = data.type; // ngo, government, rescue_team, medical, etc.
    this.description = data.description || "";
    this.email = data.email;
    this.phone = data.phone;
    this.website = data.website || "";
    this.logo = data.logo || "";
    this.location = data.location; // { lat, lng, address }
    this.serviceArea = data.serviceArea || []; // array of cities/regions
    this.resources = data.resources || []; // available resources
    this.adminUid = data.adminUid; // user who manages this org
    this.members = data.members || []; // array of user uids
    this.isVerified = data.isVerified || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
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

    if (this.id) {
      await firestore.collection("organizations").doc(this.id).set(data, { merge: true });
    } else {
      const docRef = await firestore.collection("organizations").add(data);
      this.id = docRef.id;
    }
    return this;
  }

  static async getById(id) {
    const doc = await firestore.collection("organizations").doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return Organization.fromFirestore(doc);
  }

  static async getByType(type, limit = 20) {
    const snapshot = await firestore
      .collection("organizations")
      .where("type", "==", type)
      .where("isVerified", "==", true)
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => Organization.fromFirestore(doc));
  }

  // Add member to organization
  async addMember(userUid) {
    if (!this.members.includes(userUid)) {
      this.members.push(userUid);
      await this.save();
    }
  }

  // Remove member from organization
  async removeMember(userUid) {
    this.members = this.members.filter((uid) => uid !== userUid);
    await this.save();
  }

  async delete() {
    if (!this.id) throw new Error("Cannot delete organization without ID");
    await firestore.collection("organizations").doc(this.id).delete();
  }
}

export default Organization;
