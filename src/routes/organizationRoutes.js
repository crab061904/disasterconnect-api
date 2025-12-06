import express from 'express';
import { organizationController } from '../controllers/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Middleware: All routes require login AND 'organization' role
router.use(authenticate);
router.use(authorize(['organization']));

// --- Centers ---
router.post('/centers', organizationController.createCenter);
router.get('/centers', organizationController.getCenters);
router.put('/centers/:id', organizationController.updateCenter);    // EDIT
router.delete('/centers/:id', organizationController.deleteCenter); // DELETE

// --- Announcements ---
router.post('/announcements', organizationController.createAnnouncement);
router.get('/announcements', organizationController.getAnnouncements);
router.put('/announcements/:id', organizationController.updateAnnouncement);    // EDIT
router.delete('/announcements/:id', organizationController.deleteAnnouncement); // DELETE

// --- Resources ---
router.post('/resources', organizationController.addResource);
router.get('/resources', organizationController.getResources);
router.put('/resources/:id', organizationController.updateResource);    // EDIT
router.delete('/resources/:id', organizationController.deleteResource); // DELETE

// --- Reports ---
router.post('/reports', organizationController.createReport);
router.get('/reports', organizationController.getReports);
router.put('/reports/:id', organizationController.updateReport);    // EDIT
router.delete('/reports/:id', organizationController.deleteReport); // DELETE

// --- Volunteers & Tasks ---
router.get('/volunteers', organizationController.getOrgVolunteers);
router.post('/assignments', organizationController.assignTask);
router.delete('/assignments/:volunteerId/:assignmentId', organizationController.deleteAssignment); // DELETE TASK
router.post('/needs', organizationController.postNeed);

export default router;