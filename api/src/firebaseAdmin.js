import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Ensure Firebase is not initialized more than once
if (!admin.apps.length) {
  try {
    let credential;

    // OPTION 1: Use the full JSON string (Common in Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
    } 
    // OPTION 2: Use individual variables
    else {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // Vital for Vercel
        : undefined;

      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      });
    }

    admin.initializeApp({
      credential: credential,
    });
    
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

// ✅ EXPORT 1: 'db' (Used by your citizenController)
export const db = admin.firestore();

// ✅ EXPORT 2: 'firestore' (Used by your User/Organization models)
// This alias prevents the "Module not found" crash
export const firestore = db;

// ✅ EXPORT 3: Auth
export const auth = admin.auth();

export default admin;