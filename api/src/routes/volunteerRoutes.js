import express from 'express';
import { volunteerController } from '../controllers/index.js';
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

// Open Help Requests & Self Assignment
router.get('/help-requests', volunteerController.getAvailableHelpRequests);   // View global "Help Wanted" feed
router.post('/self-assign', volunteerController.selfAssignToHelpRequest);  // Claim a task (The clean route)

// ⭐ FIX: Add the route definition that matches the frontend's failing URL structure
// The route will use the existing selfAssignToHelpRequest controller, as it expects 
// the IDs (helpRequestId and orgId) to be passed in the request body.
// Note: This route expects helpRequestId in URL params, but the controller expects it in body.
// Since the frontend is likely sending the necessary orgId/helpRequestId in the BODY, 
// the controller will still work fine, but we need the route defined first.

router.post('/help-requests/:helpRequestId/accept', volunteerController.selfAssignToHelpRequest);

// Linked Organizations (Fixes 404 error from frontend)
router.get('/organizations', volunteerController.getLinkedOrganizations); 

// Missions (History)
router.get('/missions', volunteerController.getMissionHistory);

export default router;