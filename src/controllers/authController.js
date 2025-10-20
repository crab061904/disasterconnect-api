import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { firestore } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

const usersCol = firestore.collection("users");

function createJwt(user) {
	const payload = { uid: user.id, email: user.email, role: user.role || "citizen" };
	const secret = process.env.JWT_SECRET || "change-me";
	const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
	return jwt.sign(payload, secret, { expiresIn });
}

export const authController = {
	async register(req, res) {
		try {
			const { email, password, name, role } = req.body || {};
			
			// Validation using base controller
			const validationError = BaseController.validateRequired(req.body, ['email', 'password']);
			if (validationError) {
				return BaseController.error(res, validationError, 400);
			}

			// Check if email already exists
			const existing = await usersCol.where("email", "==", email).limit(1).get();
			if (!existing.empty) {
				return BaseController.error(res, "Email already registered", 409);
			}

			// Hash password
			const passwordHash = await bcrypt.hash(password, 10);

			// Create user
			const userDoc = usersCol.doc();
			const userData = { 
				email, 
				name: name || "", 
				role: role || "citizen", 
				passwordHash, 
				createdAt: new Date().toISOString() 
			};
			await userDoc.set(userData);

			// Generate token
			const token = createJwt({ id: userDoc.id, email, role: userData.role });

			// Return success response
			return BaseController.success(res, { 
				token, 
				user: { 
					id: userDoc.id, 
					email, 
					name: userData.name, 
					role: userData.role 
				} 
			}, "User registered successfully", 201);

		} catch (err) {
			return BaseController.error(res, "Internal server error", 500, err.message);
		}
	},

	async login(req, res) {
		try {
			const { email, password } = req.body || {};
			
			// Validation using base controller
			const validationError = BaseController.validateRequired(req.body, ['email', 'password']);
			if (validationError) {
				return BaseController.error(res, validationError, 400);
			}

			// Find user by email
			const snap = await usersCol.where("email", "==", email).limit(1).get();
			if (snap.empty) {
				return BaseController.error(res, "Invalid credentials", 401);
			}

			const doc = snap.docs[0];
			const user = { id: doc.id, ...doc.data() };

			// Verify password
			const isValidPassword = await bcrypt.compare(password, user.passwordHash || "");
			if (!isValidPassword) {
				return BaseController.error(res, "Invalid credentials", 401);
			}

			// Generate token
			const token = createJwt({ 
				id: user.id, 
				email: user.email, 
				role: user.role 
			});

			// Return success response
			return BaseController.success(res, { 
				token, 
				user: { 
					id: user.id, 
					email: user.email, 
					name: user.name || "", 
					role: user.role || "citizen" 
				} 
			}, "Login successful");

		} catch (err) {
			return BaseController.error(res, "Internal server error", 500, err.message);
		}
	},

	async getProfile(req, res) {
		try {
			// This would be used with the auth middleware
			const user = req.user;
			return BaseController.success(res, { 
				user: { 
					id: user.uid, 
					email: user.email, 
					role: user.role 
				} 
			}, "Profile retrieved successfully");
		} catch (err) {
			return BaseController.error(res, "Internal server error", 500, err.message);
		}
	}
};
