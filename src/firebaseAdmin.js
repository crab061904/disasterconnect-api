import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
// In Firebase Functions, admin SDK initializes automatically with default credentials
// For local development, it uses service account from env
let app;
if (!admin.apps.length) {
	// Check if running in Firebase Functions environment
	const isFirebaseFunctions = process.env.FUNCTION_TARGET || process.env.FIREBASE_CONFIG;
	
	if (isFirebaseFunctions) {
		// In Firebase Functions, use default credentials
		try {
			app = admin.initializeApp({
				projectId: "dissasterconnect",
			});
			console.log("Firebase Admin initialized with default credentials (Functions environment)");
		} catch (error) {
			console.error("Firebase Admin initialization error:", error);
			throw error;
		}
	} else {
		// Local development: use service account from env
		const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
		const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

		if (!serviceAccountJson && !serviceAccountPath) {
			throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH env var");
		}

		const credential = serviceAccountJson
			? admin.credential.cert(JSON.parse(serviceAccountJson))
			: admin.credential.cert(serviceAccountPath);

		try {
			app = admin.initializeApp({
				credential,
				projectId: "dissasterconnect",
			});
			console.log("Firebase Admin initialized successfully (local environment)");
		} catch (error) {
			console.error("Firebase Admin initialization error:", error);
			throw error;
		}
	}
} else {
	app = admin.app();
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export default app;
