import express from 'express';
import { volunteerController } from '../controllers/volunteerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(authorize(['volunteer'])); // Only Volunteers can access

// Availability
router.post('/availability', volunteerController.setAvailability);
router.get('/availability', volunteerController.getMyAvailability);

// Assignments
router.get('/assignments', volunteerController.getAssignments);
router.patch('/assignments/:assignmentId', volunteerController.updateAssignmentStatus);

// Missions
router.get('/missions', volunteerController.getMissionHistory);

export default router;