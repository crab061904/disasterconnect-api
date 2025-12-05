// File: API-BACK/disasterconnect-api/src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { firestore, auth as adminAuth } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";
import { User } from "../models/index.js"; // Ensure User model is imported

const usersCol = firestore.collection("users");

function createJwt(user) {
  const payload = { 
    uid: user.uid || user.id, 
    email: user.email, 
    roles: user.roles || ["user"],
    isVolunteer: user.isVolunteer || false,
    // Add currentRole to the token so frontend knows which dashboard to render
    currentRole: user.currentRole || (user.roles && user.roles[0]) || "user"
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
        role, // Frontend sends: 'civilian', 'volunteer', or 'organization'
        profileData = {} 
      } = req.body;
      
      // Validation
      const validationError = BaseController.validateRequired(req.body, ['email', 'password', 'role']);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      const allowedRoles = ['civilian', 'individual', 'volunteer', 'organization'];
      if (!allowedRoles.includes(role)) {
        return BaseController.error(res, "Invalid role selection.", 400);
      }

      // Check if email exists
      const existing = await usersCol.where("email", "==", email).limit(1).get();
      if (!existing.empty) {
        return BaseController.error(res, "Email already registered", 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // --- ROLE ASSIGNMENT LOGIC ---
      let roles = ["user"]; // Everyone is a user/civilian by default
      let isVolunteer = false;

      if (role === 'volunteer') {
        // If signing up as volunteer, they get BOTH roles
        roles.push("volunteer"); 
        isVolunteer = true;
      } 
      else if (role === 'organization') {
        // Organization is distinct, usually doesn't have 'user' role
        roles = ["organization"];
      }
      // If role === 'civilian' or 'individual', they stay as ["user"]

      // Create user document
      const userDoc = usersCol.doc();
      const userData = { 
        uid: userDoc.id,
        email, 
        displayName: name || email.split('@')[0],
        name: name || "",
        roles, // Stores ["user", "volunteer"] or ["user"]
        isVolunteer,
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
        isVolunteer,
        currentRole: role === 'civilian' ? 'user' : role // Set initial context
      });

      // Return success response
      return BaseController.success(res, { 
        token, 
        user: { 
          id: userDoc.id, 
          email, 
          name: userData.name, 
          roles,
          isVolunteer
        } 
      }, "User registered successfully", 201);

    } catch (err) {
      console.error("Registration error:", err);
      return BaseController.error(res, "Internal server error", 500, err.message);
    }
  },

  async login(req, res) {
    try {
      // role here is the TARGET dashboard user wants to enter ('civilian', 'volunteer', 'organization')
      const { email, password, role } = req.body;
      
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

      // --- DASHBOARD ACCESS LOGIC ---
      let targetDashboard = role;

      // If user didn't select a role (simple login), default to their highest role or 'user'
      if (!targetDashboard) {
        if (user.roles.includes('organization')) targetDashboard = 'organization';
        else if (user.roles.includes('volunteer')) targetDashboard = 'volunteer';
        else targetDashboard = 'civilian';
      }

      // Map Frontend "civilian" request to Backend "user" role
      const dbRoleToCheck = targetDashboard === 'civilian' ? 'user' : targetDashboard;

      // Check permissions
      if (!user.roles || !user.roles.includes(dbRoleToCheck)) {
        return BaseController.error(res, `You do not have permission to access the ${targetDashboard} portal.`, 403);
      }

      // Generate token with the SPECIFIC role they logged in as
      const token = createJwt({
        ...user,
        currentRole: dbRoleToCheck // This tells frontend which UI to show
      });

      // Don't send password hash in response
      delete user.passwordHash;

      return BaseController.success(res, { 
        token, 
        user: {
          ...user,
          currentRole: dbRoleToCheck,
          // Helper for frontend to know what OTHER options to show in dropdown
          availableRoles: user.roles.map(r => r === 'user' ? 'civilian' : r)
        }
      }, `Logged into ${targetDashboard} dashboard`);

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
        // Create new user (Default to Civilian/User)
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

      // --- UPGRADE LOGIC ---
      
      // If simply updating the volunteer flag
      if (isVolunteer !== undefined) {
        user.isVolunteer = Boolean(isVolunteer);
        
        if (isVolunteer) {
          // If becoming a volunteer, ADD role if missing
          if (!user.roles.includes('volunteer')) {
            user.roles.push('volunteer');
          }
        } else {
          // If resigning, REMOVE role
          user.roles = user.roles.filter(r => r !== 'volunteer');
        }
      }

      // If manually sending a roles array (Admin override)
      if (roles && Array.isArray(roles)) {
        // Validation to prevent user from removing their own admin status if they are admin
        if (requestingUser.uid === userId && 
            requestingUser.roles?.includes('admin') && 
            !roles.includes('admin')) {
          return BaseController.error(res, "Cannot remove your own admin role", 400);
        }
        user.roles = roles;
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