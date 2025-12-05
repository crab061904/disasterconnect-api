import express from 'express';
import { volunteerController } from '../controllers/index.js'; // Ensure index.js exports volunteerController
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Middleware: All routes require login AND 'volunteer' role
router.use(authenticate);
router.use(authorize(['volunteer']));

// Availability
router.post('/availability', volunteerController.setAvailability);
router.get('/availability', volunteerController.getMyAvailability);

// Assignments (Directly assigned by Orgs)
router.get('/assignments', volunteerController.getAssignments);
router.patch('/assignments/:assignmentId', volunteerController.updateAssignmentStatus);

// Open Needs & Self Assignment
router.get('/needs', volunteerController.getOpenNeeds);       // View global "Help Wanted" feed
router.post('/self-assign', volunteerController.selfAssign);  // Claim a task

// Missions (History)
router.get('/missions', volunteerController.getMissionHistory);

export default router;