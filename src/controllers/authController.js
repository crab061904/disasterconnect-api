// File: API-BACK/disasterconnect-api/src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { firestore, auth as adminAuth } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";

const usersCol = firestore.collection("users");

function createJwt(user) {
  const payload = { 
    uid: user.uid || user.id, 
    email: user.email, 
    roles: user.roles || ["user"],
    isVolunteer: user.isVolunteer || false
  };
  const secret = process.env.JWT_SECRET || "change-me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export const authController = {
  async register(req, res) {
    try {
      const { 
        email, 
        password, 
        name, 
        role, // 'individual' or 'organization'
        isVolunteer = false,
        profileData = {} 
      } = req.body;
      
      // Validation
      const validationError = BaseController.validateRequired(req.body, ['email', 'password', 'role']);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      if (!['individual', 'organization'].includes(role)) {
        return BaseController.error(res, "Invalid role. Must be 'individual' or 'organization'", 400);
      }

      // Check if email exists
      const existing = await usersCol.where("email", "==", email).limit(1).get();
      if (!existing.empty) {
        return BaseController.error(res, "Email already registered", 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Determine roles
      const roles = ["user"]; // Base role for all users
      if (role === 'organization') {
        roles.push("organization");
      } else if (isVolunteer) {
        roles.push("volunteer");
      }

      // Create user document
      const userDoc = usersCol.doc();
      const userData = { 
        uid: userDoc.id,
        email, 
        displayName: name || email.split('@')[0],
        name: name || "",
        roles,
        isVolunteer: roles.includes("volunteer"),
        passwordHash,
        ...profileData,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await userDoc.set(userData);

      // Generate token
      const token = createJwt({ 
        id: userDoc.id, 
        email, 
        roles,
        isVolunteer: roles.includes("volunteer")
      });

      // Return success response
      return BaseController.success(res, { 
        token, 
        user: { 
          id: userDoc.id, 
          email, 
          name: userData.name, 
          roles,
          isVolunteer: roles.includes("volunteer")
        } 
      }, "User registered successfully", 201);

    } catch (err) {
      console.error("Registration error:", err);
      return BaseController.error(res, "Internal server error", 500, err.message);
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Validation
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
      const token = createJwt(user);

      // Don't send password hash in response
      delete user.passwordHash;

      return BaseController.success(res, { 
        token, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles || [],
          isVolunteer: user.isVolunteer || false
        }
      }, "Login successful");

    } catch (err) {
      console.error("Login error:", err);
      return BaseController.error(res, "Internal server error", 500, err.message);
    }
  },

  async googleLogin(req, res) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return BaseController.error(res, "Google token is required", 400);
      }

      // Verify Google token
      const decodedToken = await adminAuth.verifyIdToken(token);
      const { email, name, picture } = decodedToken;

      // Find or create user
      let user = await User.getByEmail(email);
      let isNewUser = false;

      if (!user) {
        // Create new user
        const userDoc = usersCol.doc();
        user = new User({
          uid: userDoc.id,
          email,
          displayName: name || email.split('@')[0],
          name: name || "",
          roles: ["user"],
          isVolunteer: false,
          profilePicture: picture || "",
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await user.save();
        isNewUser = true;
      }

      // Generate JWT
      const jwtToken = createJwt(user);

      // Don't send password hash in response
      const userResponse = {
        id: user.uid,
        email: user.email,
        name: user.name,
        roles: user.roles || [],
        isVolunteer: user.isVolunteer || false
      };

      return BaseController.success(res, { 
        token: jwtToken, 
        user: userResponse,
        isNewUser
      }, isNewUser ? "User registered successfully" : "Login successful");

    } catch (err) {
      console.error("Google login error:", err);
      return BaseController.error(res, "Authentication failed", 401, err.message);
    }
  },

  async getProfile(req, res) {
    try {
      const { uid } = req.user;

      const user = await User.getById(uid);
      if (!user) {
        return BaseController.error(res, "User not found", 404);
      }

      // Don't send sensitive data
      const { passwordHash, ...userData } = user.toFirestore();

      return BaseController.success(res, userData, "Profile retrieved successfully");

    } catch (err) {
      console.error("Get profile error:", err);
      return BaseController.error(res, "Internal server error", 500, err.message);
    }
  },

  async updateRoles(req, res) {
    try {
      const { userId } = req.params;
      const { roles, isVolunteer } = req.body;
      const requestingUser = req.user;

      // Only allow admins or the user themselves to update roles
      if (requestingUser.uid !== userId && !requestingUser.roles?.includes('admin')) {
        return BaseController.error(res, "Unauthorized", 403);
      }

      // Get current user data
      const user = await User.getById(userId);
      if (!user) {
        return BaseController.error(res, "User not found", 404);
      }

      // Update roles if provided
      if (roles) {
        // Ensure user can't remove their own admin role
        if (requestingUser.uid === userId && 
            requestingUser.roles?.includes('admin') && 
            !roles.includes('admin')) {
          return BaseController.error(res, "Cannot remove your own admin role", 400);
        }
        
        // Update roles
        user.roles = Array.isArray(roles) ? roles : [roles];
      }

      // Update volunteer status if provided
      if (isVolunteer !== undefined) {
        user.isVolunteer = Boolean(isVolunteer);
        if (isVolunteer && !user.roles.includes('volunteer')) {
          user.roles.push('volunteer');
        } else if (!isVolunteer) {
          user.roles = user.roles.filter(r => r !== 'volunteer');
        }
      }

      // Save changes
      await user.save();

      // Generate new token with updated roles
      const token = createJwt(user);

      return BaseController.success(res, { 
        token,
        user: {
          id: user.uid,
          email: user.email,
          name: user.name,
          roles: user.roles,
          isVolunteer: user.isVolunteer
        }
      }, "User roles updated successfully");

    } catch (err) {
      console.error("Update roles error:", err);
      return BaseController.error(res, "Internal server error", 500, err.message);
    }
  }
};