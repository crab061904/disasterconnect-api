// File: API-BACK/disasterconnect-api/src/models/User.js
import { firestore } from "../firebaseAdmin.js";

/**
 * User Model
 * Collection: users
 */
class User {
  constructor(data) {
    // Core user data
    this.uid = data.uid;
    this.email = data.email;
    this.displayName = data.displayName || "";
    this.phoneNumber = data.phoneNumber || "";
    
    // Role management
    this.roles = data.roles || ["user"]; // user, volunteer, organization, admin
    this.isVolunteer = data.isVolunteer || false;
    
    // Profile data
    this.profilePicture = data.profilePicture || "";
    this.location = data.location || { lat: null, lng: null, address: "" };
    this.isVerified = data.isVerified || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    
    // Volunteer-specific data
    if (this.roles.includes("volunteer") || this.isVolunteer) {
      this.skills = data.skills || [];
      this.availability = data.availability || {};
      this.volunteerStatus = data.volunteerStatus || "pending"; // pending, approved, rejected
    }
    
    // Organization-specific data
    if (this.roles.includes("organization")) {
      this.organizationDetails = data.organizationDetails || {
        name: "",
        type: "",
        contact: "",
        verificationStatus: "pending" // pending, verified, rejected
      };
    }
  }

  // Convert to plain object for Firestore
  toFirestore() {
    const data = {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      phoneNumber: this.phoneNumber,
      roles: this.roles,
      isVolunteer: this.isVolunteer,
      profilePicture: this.profilePicture,
      location: this.location,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    // Add volunteer fields if applicable
    if (this.roles.includes("volunteer") || this.isVolunteer) {
      data.skills = this.skills;
      data.availability = this.availability;
      data.volunteerStatus = this.volunteerStatus;
    }

    // Add organization fields if applicable
    if (this.roles.includes("organization")) {
      data.organizationDetails = this.organizationDetails;
    }

    return data;
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new User({ ...data, uid: doc.id });
  }

  // Save user to Firestore
  async save() {
    this.updatedAt = new Date();
    const userRef = firestore.collection("users").doc(this.uid);
    await userRef.set(this.toFirestore(), { merge: true });
    return this;
  }

  // Get user by ID
  static async getById(uid) {
    const doc = await firestore.collection("users").doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return User.fromFirestore(doc);
  }

  // Get user by email
  static async getByEmail(email) {
    const snapshot = await firestore
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return User.fromFirestore(snapshot.docs[0]);
  }

  // Update user
  async update(updates) {
    Object.assign(this, updates);
    return this.save();
  }

  // Delete user
  async delete() {
    await firestore.collection("users").doc(this.uid).delete();
  }

  // Get all users with pagination
  static async getAll(limit = 10, startAfter = null) {
    let query = firestore.collection("users").orderBy("createdAt", "desc").limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => User.fromFirestore(doc));
  }

  // Check if user has a specific role
  hasRole(role) {
    return this.roles.includes(role);
  }

  // Add a role to the user
  async addRole(role) {
    if (!this.roles.includes(role)) {
      this.roles.push(role);
      if (role === 'volunteer') {
        this.isVolunteer = true;
      }
      await this.save();
    }
    return this;
  }

  // Remove a role from the user
  async removeRole(role) {
    this.roles = this.roles.filter(r => r !== role);
    if (role === 'volunteer') {
      this.isVolunteer = false;
    }
    await this.save();
    return this;
  }
}

export default User;