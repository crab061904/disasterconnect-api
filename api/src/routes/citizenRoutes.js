import express from 'express';
import { citizenController } from '../controllers/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require login and 'user' (civilian) role
router.use(authenticate);
router.use(authorize(['civilian','citizen','user'])); // In your DB, civilians have the role 'user'

// Routes matching your frontend services
router.post('/requests', citizenController.createRequest);
router.get('/requests/active', citizenController.getMyActiveRequests);
router.get('/centers', citizenController.getAllCenters);

export default router;