// File: API-BACK/disasterconnect-api/src/routes/auth.js
import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.get('/profile', authenticate, authController.getProfile);
router.patch('/users/:userId/roles', authenticate, authController.updateRoles);

export default router;