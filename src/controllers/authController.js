import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { firestore, auth as adminAuth } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

const usersCol = firestore.collection("users");

function createJwt(user) {
  const payload = {
    uid: user.id,
    email: user.email,
    role: user.role || "citizen",
  };
  const secret = process.env.JWT_SECRET || "change-me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export const authController = {
  async register(req, res) {
    try {
      const { email, password, name, role, profileData } = req.body || {};

      // Validation using base controller
      const validationError = BaseController.validateRequired(req.body, [
        "email",
        "password",
      ]);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      // Check if email already exists
      const existing = await usersCol
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!existing.empty) {
        return BaseController.error(res, "Email already registered", 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with profile data
      const userDoc = usersCol.doc();
      const userData = {
        email,
        name: name || "",
        role: role || "citizen",
        passwordHash,
        ...profileData, // Spread profile data (location, skills, orgName, etc.)
        createdAt: new Date().toISOString(),
      };
      await userDoc.set(userData);

      // Generate token
      const token = createJwt({ id: userDoc.id, email, role: userData.role });

      // Return success response
      return BaseController.success(
        res,
        {
          token,
          user: {
            id: userDoc.id,
            email,
            name: userData.name,
            role: userData.role,
          },
        },
        "User registered successfully",
        201
      );
    } catch (err) {
      return BaseController.error(
        res,
        "Internal server error",
        500,
        err.message
      );
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body || {};

      // Validation using base controller
      const validationError = BaseController.validateRequired(req.body, [
        "email",
        "password",
      ]);
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
      const isValidPassword = await bcrypt.compare(
        password,
        user.passwordHash || ""
      );
      if (!isValidPassword) {
        return BaseController.error(res, "Invalid credentials", 401);
      }

      // Generate token
      const token = createJwt({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Return success response
      return BaseController.success(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role || "citizen",
          },
        },
        "Login successful"
      );
    } catch (err) {
      return BaseController.error(
        res,
        "Internal server error",
        500,
        err.message
      );
    }
  },

  async googleLogin(req, res) {
    try {
      const { idToken, role, profileData } = req.body || {};

      // Validation
      const validationError = BaseController.validateRequired(req.body, [
        "idToken",
      ]);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      // Verify the Firebase ID token
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (error) {
        console.error("Token verification failed:", error);
        return BaseController.error(res, "Invalid Google token", 401);
      }

      const { email, name, uid: firebaseUid } = decodedToken;

      // Check if user already exists
      const existingSnap = await usersCol
        .where("email", "==", email)
        .limit(1)
        .get();

      let user;
      let userId;

      if (!existingSnap.empty) {
        // User exists, log them in
        const doc = existingSnap.docs[0];
        userId = doc.id;
        user = { id: userId, ...doc.data() };
      } else {
        // New user - require role and profileData
        if (!role) {
          return BaseController.error(
            res,
            "User does not exist. Please complete registration.",
            404
          );
        }

        // Create new user with profile data
        const userDoc = usersCol.doc();
        userId = userDoc.id;
        const userData = {
          email,
          name: name || email.split("@")[0],
          role: role || "citizen",
          firebaseUid,
          authProvider: "google",
          ...profileData, // Spread profile data
          createdAt: new Date().toISOString(),
        };
        await userDoc.set(userData);
        user = { id: userId, ...userData };
      }

      // Generate JWT token
      const token = createJwt({
        id: userId,
        email: user.email,
        role: user.role,
      });

      // Return success response
      return BaseController.success(
        res,
        {
          token,
          user: {
            id: userId,
            email: user.email,
            name: user.name || "",
            role: user.role || "citizen",
          },
        },
        "Google login successful"
      );
    } catch (err) {
      console.error("Google login error:", err);
      return BaseController.error(
        res,
        "Internal server error",
        500,
        err.message
      );
    }
  },

  async getProfile(req, res) {
    try {
      // This would be used with the auth middleware
      const user = req.user;
      return BaseController.success(
        res,
        {
          user: {
            id: user.uid,
            email: user.email,
            role: user.role,
          },
        },
        "Profile retrieved successfully"
      );
    } catch (err) {
      return BaseController.error(
        res,
        "Internal server error",
        500,
        err.message
      );
    }
  },
};
