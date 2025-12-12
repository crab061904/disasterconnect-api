// api/src/routes/adminRoutes.js
import express from 'express';
import { adminController } from '../controllers/adminController.js';

const router = express.Router();

// Get all volunteers - No authentication required
router.get('/volunteers', adminController.getAllVolunteers);

export default router;