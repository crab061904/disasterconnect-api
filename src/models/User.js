import { firestore } from "../firebaseAdmin.js";

/**
 * User Model
 * Collection: users
 */
class User {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.displayName = data.displayName || "";
    this.phoneNumber = data.phoneNumber || "";
    this.role = data.role || "user"; // user, volunteer, admin, organization
    this.profilePicture = data.profilePicture || "";
    this.location = data.location || { lat: null, lng: null, address: "" };
    this.isVerified = data.isVerified || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to plain object for Firestore
  toFirestore() {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      phoneNumber: this.phoneNumber,
      role: this.role,
      profilePicture: this.profilePicture,
      location: this.location,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
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
}

export default User;
