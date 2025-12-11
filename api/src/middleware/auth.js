// File: API-BACK/disasterconnect-api/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    
    // Get user from database
    const user = await User.getById(decoded.uid);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Add user to request object
    req.user = {
      uid: user.uid,
      email: user.email,
      roles: user.roles || [],
      isVolunteer: user.isVolunteer || false
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

// Role-based access control middleware
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    if (roles.length && !roles.some(role => req.user.roles.includes(role))) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to access this resource' 
      });
    }

    next();
  };
};