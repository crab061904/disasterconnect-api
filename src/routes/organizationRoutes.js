import express from 'express';
import { organizationController } from '../controllers/organizationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(authenticate);
router.use(authorize(['organization'])); // Only Orgs can access

// Evacuation Centers
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

// Org-specific Volunteers list
router.get('/volunteers', organizationController.getOrgVolunteers);

export default router;