import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Firebase Admin
// In Firebase Functions, admin SDK initializes automatically with default credentials
// For local development, it uses service account from env
let app;
let firestore;
if (!admin.apps.length) {
  // Check if running in Firebase Functions environment
  const isFirebaseFunctions =
    process.env.FUNCTION_TARGET || process.env.FIREBASE_CONFIG;

  if (isFirebaseFunctions) {
    // In Firebase Functions, use default credentials
    try {
      app = admin.initializeApp({
        projectId: "dissasterconnect",
      });
      console.log(
        "Firebase Admin initialized with default credentials (Functions environment)"
      );
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
      throw error;
    }
  } else {
    // Local development: use service account from file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set"
      );
    }

    // Use the service account file directly with dynamic import
    const serviceAccount = (
      await import(
        "file://" + path.resolve(process.cwd(), serviceAccountPath),
        { with: { type: "json" } }
      )
    ).default;
    const credential = admin.credential.cert(serviceAccount);

    try {
      app = admin.initializeApp({
        credential,
        projectId: "dissasterconnect",
      });
      console.log(
        "Firebase Admin initialized successfully (local environment)"
      );
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
      throw error;
    }
  }
} else {
  app = admin.app();
}

// Initialize Firestore and Auth after app is initialized
if (app) {
  firestore = admin.firestore();
  // Initialize other Firebase services here if needed
}

// Export initialized services
export { firestore };
// Export auth only if app is initialized
export const auth = app ? admin.auth() : null;

export default app;
