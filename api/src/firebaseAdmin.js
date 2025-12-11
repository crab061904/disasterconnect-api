import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  try {
    // 1. Get the private key
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // Fix newlines for Vercel
      : undefined;

    // 2. Initialize with explicit credentials (Best for Vercel)
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

// ✅ FIX: Export as 'db' (not 'firestore') to match your controller
export const db = admin.firestore();
export const auth = admin.auth();

export default admin;