import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { firestore, auth as adminAuth } from "../firebaseAdmin.js";
import { BaseController } from "./BaseController.js";
import { User } from "../models/index.js"; 

const usersCol = firestore.collection("users");

function createJwt(user) {
  const payload = { 
    uid: user.uid || user.id, 
    email: user.email, 
    roles: user.roles || ["user"],
    isVolunteer: user.isVolunteer || false,
    // Add currentRole so frontend knows which dashboard to load
    currentRole: user.currentRole || (user.roles && user.roles[0]) || "user"
  };
  const secret = process.env.JWT_SECRET || "change-me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export const authController = {
  // ================= REGISTER =================
  async register(req, res) {
    try {
      const { 
        email, 
        password, 
        name, 
        role, // 'civilian', 'volunteer', 'organization'
        
        // --- FIELDS FROM YOUR UI SCREENSHOTS ---
        currentLocation,        // Civilian
        skills,                 // Volunteer
        availability,           // Volunteer
        proofOfVolunteerStatus, // Volunteer (File URL/ID)
        
        organizationName,       // Organization
        organizationType,       // Organization
        contactInformation,     // Organization
        proofOfLegitimacy,      // Organization (File URL/ID)
        
        profileData = {} 
      } = req.body;
      
      // 1. Validation
      const validationError = BaseController.validateRequired(req.body, ['email', 'password', 'role']);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      const allowedRoles = ['civilian', 'individual', 'volunteer', 'organization'];
      if (!allowedRoles.includes(role)) {
        return BaseController.error(res, "Invalid role selection.", 400);
      }

      // 2. Check if email exists
      const existing = await usersCol.where("email", "==", email).limit(1).get();
      if (!existing.empty) {
        return BaseController.error(res, "Email already registered", 409);
      }

      // 3. Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // 4. Role & Data Mapping Logic
      let roles = ["user"]; 
      let isVolunteer = false;
      let finalDisplayName = name;
      let extraData = {};

      // --- CIVILIAN LOGIC ---
      if (role === 'civilian') {
        extraData = {
          location: { 
            address: currentLocation || "",
            lat: null, 
            lng: null 
          }
        };
      }

      // --- VOLUNTEER LOGIC ---
      else if (role === 'volunteer') {
        roles.push("volunteer"); 
        isVolunteer = true;
        
        // Convert comma-separated string to array if necessary
        const skillsArray = Array.isArray(skills) 
          ? skills 
          : (skills ? skills.split(',').map(s => s.trim()) : []);

        extraData = {
          skills: skillsArray,
          availability: availability || "Available",
          documents: {
            proofOfStatus: proofOfVolunteerStatus || ""
          }
        };
      } 

      // --- ORGANIZATION LOGIC ---
      else if (role === 'organization') {
        roles = ["organization"];
        finalDisplayName = organizationName || name; // Use Org Name as main display name
        
        extraData = {
          organizationDetails: {
            name: organizationName,
            type: organizationType,
            contact: contactInformation,
            proofOfLegitimacy: proofOfLegitimacy || "",
            verificationStatus: "pending"
          }
        };
      }

      // 5. Create user document
      const userDoc = usersCol.doc();
      const userData = { 
        uid: userDoc.id,
        email, 
        displayName: finalDisplayName,
        name: finalDisplayName,
        roles, 
        isVolunteer,
        passwordHash,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Merge specific profile data
        ...extraData,
        ...profileData
      };

      await userDoc.set(userData);

      // 6. Generate token
      const token = createJwt({ 
        id: userDoc.id, 
        email, 
        roles,
        isVolunteer,
        currentRole: role === 'civilian' ? 'user' : role 
      });

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

  // ================= LOGIN =================
  async login(req, res) {
    try {
      // Role is REQUIRED to ensure we log them into the correct portal
      const { email, password, role } = req.body;
      
      const validationError = BaseController.validateRequired(req.body, ['email', 'password', 'role']);
      if (validationError) {
        return BaseController.error(res, validationError, 400);
      }

      // Find user
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

      // --- STRICT PORTAL SECURITY CHECK ---
      // Map "civilian" frontend request to "user" database role
      const dbRoleToCheck = role === 'civilian' ? 'user' : role;

      // Check if user actually HAS this role
      if (!user.roles || !user.roles.includes(dbRoleToCheck)) {
        return BaseController.error(res, `Access Denied: You are not registered as a ${role}.`, 403);
      }

      // Generate token locked to this role context
      const token = createJwt({
        ...user,
        currentRole: dbRoleToCheck 
      });

      delete user.passwordHash;

      return BaseController.success(res, { 
        token, 
        user: {
          ...user,
          currentRole: dbRoleToCheck,
          availableRoles: user.roles.map(r => r === 'user' ? 'civilian' : r)
        }
      }, `Logged into ${role} dashboard`);

    } catch (err) {
      console.error("Login error:", err);
      return BaseController.error(res, "Internal server error", 500, err.message);
    }
  },

  // ================= GOOGLE LOGIN =================
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

  // ================= GET PROFILE =================
  async getProfile(req, res) {
    try {
      const { uid } = req.user;

      const user = await User.getById(uid);
      if (!user) {
        return BaseController.error(res, "User not found", 404);
      }

      const { passwordHash, ...userData } = user.toFirestore();
      return BaseController.success(res, userData, "Profile retrieved successfully");

    } catch (err) {
      console.error("Get profile error:", err);
      return BaseController.error(res, "Internal server error", 500, err.message);
    }
  },

  // ================= UPDATE ROLES (Upgrade Account) =================
  async updateRoles(req, res) {
    try {
      const { userId } = req.params;
      const { roles, isVolunteer } = req.body;
      const requestingUser = req.user;

      // Security check
      if (requestingUser.uid !== userId && !requestingUser.roles?.includes('admin')) {
        return BaseController.error(res, "Unauthorized", 403);
      }

      const user = await User.getById(userId);
      if (!user) {
        return BaseController.error(res, "User not found", 404);
      }

      // Logic: Update volunteer status
      if (isVolunteer !== undefined) {
        user.isVolunteer = Boolean(isVolunteer);
        
        if (isVolunteer) {
          // Add 'volunteer' role if missing
          if (!user.roles.includes('volunteer')) {
            user.roles.push('volunteer');
          }
        } else {
          // Remove 'volunteer' role
          user.roles = user.roles.filter(r => r !== 'volunteer');
        }
      }

      // Logic: Manual role array update (Admin only)
      if (roles && Array.isArray(roles)) {
        if (requestingUser.uid === userId && 
            requestingUser.roles?.includes('admin') && 
            !roles.includes('admin')) {
          return BaseController.error(res, "Cannot remove your own admin role", 400);
        }
        user.roles = roles;
      }

      await user.save();

      // Return new token with updated permissions
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