import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { firestore, auth as adminAuth } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

const usersCol = firestore.collection("users");

function createJwt(user) {
  const payload = {
    uid: user.id,
    email: user.email,
    roles: user.roles || [],
    activeRole: user.activeRole || "citizen",
    organizations: user.organizations || [],
  };

  const secret = process.env.JWT_SECRET || "change-me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(payload, secret, { expiresIn });
}

export const authController = {
  // ================= REGISTER ==================
  async register(req, res) {
    try {
      const { email, password, name, role, profileData = {} } = req.body || {};

      const validationError = BaseController.validateRequired(req.body, [
        "email",
        "password",
        "role",
      ]);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      const existing = await usersCol
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!existing.empty) {
        return BaseController.error(res, "Email already registered", 409);
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userData = {
        email,
        displayName: name || email.split("@")[0],
        passwordHash,

        roles: [role], // ✅ MULTI ROLE
        activeRole: role, // ✅ ACTIVE ROLE
        organizations: [], // ✅ ORG ARRAY

        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        ...profileData,
      };

      const userDoc = usersCol.doc();
      await userDoc.set(userData);

      const token = createJwt({
        id: userDoc.id,
        ...userData,
      });

      return BaseController.success(
        res,
        {
          token,
          user: {
            id: userDoc.id,
            email: userData.email,
            displayName: userData.displayName,
            roles: userData.roles,
            activeRole: userData.activeRole,
            organizations: userData.organizations,
          },
        },
        "User registered successfully",
        201
      );
    } catch (err) {
      console.error("Registration error:", err);
      return BaseController.error(
        res,
        "Internal server error",
        500,
        err.message
      );
    }
  },

  // ================= LOGIN ==================
  async login(req, res) {
    try {
      const { email, password } = req.body || {};

      const validationError = BaseController.validateRequired(req.body, [
        "email",
        "password",
      ]);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      const snap = await usersCol.where("email", "==", email).limit(1).get();

      if (snap.empty) {
        return BaseController.error(res, "Invalid credentials", 401);
      }

      const doc = snap.docs[0];
      const user = { id: doc.id, ...doc.data() };

      const isValidPassword = await bcrypt.compare(
        password,
        user.passwordHash || ""
      );

      if (!isValidPassword) {
        return BaseController.error(res, "Invalid credentials", 401);
      }

      const token = createJwt(user);

      return BaseController.success(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName || "",
            roles: user.roles || [],
            activeRole: user.activeRole || "citizen",
            organizations: user.organizations || [],
          },
        },
        "Login successful"
      );
    } catch (err) {
      console.error("Login error:", err);
      return BaseController.error(
        res,
        "Internal server error",
        500,
        err.message
      );
    }
  },

  // ================= GOOGLE LOGIN ==================
  async googleLogin(req, res) {
    try {
      const { idToken, role, roles, profileData = {} } = req.body || {};

      const validationError = BaseController.validateRequired(req.body, [
        "idToken",
      ]);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (error) {
        console.error("Token verification failed:", error);
        return BaseController.error(res, "Invalid Google token", 401);
      }

      const { email, name, uid: firebaseUid } = decodedToken;

      const existingSnap = await usersCol
        .where("email", "==", email)
        .limit(1)
        .get();

      let user;
      let userId;

      if (!existingSnap.empty) {
        // User exists - return existing user
        const doc = existingSnap.docs[0];
        userId = doc.id;
        user = { id: userId, ...doc.data() };
      } else {
        // User doesn't exist - need role(s) to create account
        // Support both 'role' (single) and 'roles' (array) for backward compatibility
        const userRoles = roles || (role ? [role] : []);
        
        if (!userRoles || userRoles.length === 0) {
          // Return 401 (Unauthorized) instead of 404 to indicate user needs to complete registration
          return BaseController.error(
            res,
            "User does not exist. Please complete registration.",
            401
          );
        }

        const userDoc = usersCol.doc();
        userId = userDoc.id;

        user = {
          email,
          displayName: name || email.split("@")[0],
          firebaseUid,
          authProvider: "google",

          roles: userRoles, // Support multiple roles
          activeRole: userRoles[0], // Set first role as active
          organizations: [],

          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),

          ...profileData,
        };

        await userDoc.set(user);
        user.id = userId;
      }

      const token = createJwt(user);

      return BaseController.success(
        res,
        {
          token,
          user: {
            id: userId,
            email: user.email,
            displayName: user.displayName,
            roles: user.roles || [],
            activeRole: user.activeRole || (user.roles && user.roles[0]) || "citizen",
            organizations: user.organizations || [],
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

  // ================= PROFILE ==================
  async getProfile(req, res) {
    try {
      const user = req.user;

      return BaseController.success(
        res,
        {
          user: {
            id: user.uid,
            email: user.email,
            roles: user.roles,
            activeRole: user.activeRole,
            organizations: user.organizations,
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
