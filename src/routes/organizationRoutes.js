import express from 'express';
import { organizationController } from '../controllers/index.js'; // Ensure index.js exports organizationController
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Middleware: All routes require login AND 'organization' role
router.use(authenticate);
router.use(authorize(['organization']));

// Centers
router.post('/centers', organizationController.createCenter);
router.get('/centers', organizationController.getCenters);

// Announcements
router.post('/announcements', organizationController.createAnnouncement);
router.get('/announcements', organizationController.getAnnouncements);

// Resources
router.post('/resources', organizationController.addResource);
router.get('/resources', organizationController.getResources);

// Reports
router.post('/reports', organizationController.createReport);
router.get('/reports', organizationController.getReports);

// Volunteers & Tasks
router.get('/volunteers', organizationController.getOrgVolunteers); // View volunteers associated with org
router.post('/assignments', organizationController.assignTask);     // Direct assignment
router.post('/needs', organizationController.postNeed);             // Post "Help Wanted"

export default router;