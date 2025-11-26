import express from "express";
import organizationController from "../controllers/organizationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Organization CRUD
router.post("/", organizationController.createOrganization);

// Middleware to verify organization access
const verifyOrgAccess = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { uid } = req.user;

    // Import firestore here or at top of file
    const { firestore } = await import("../firebaseAdmin.js");

    const orgDoc = await firestore.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const orgData = orgDoc.data();

    // Check if user is admin or member of organization
    if (orgData.adminUid !== uid && !orgData.members.includes(uid)) {
      return res.status(403).json({
        error: "Access denied. You must be an organization admin or member.",
      });
    }

    req.orgId = orgId;
    req.organization = orgData;
    next();
  } catch (error) {
    console.error("Error verifying organization access:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Apply org access middleware to routes with :orgId
router.use("/:orgId", verifyOrgAccess);

// Announcements
router.get("/:orgId/announcements", organizationController.getAnnouncements);
router.post("/:orgId/announcements", organizationController.createAnnouncement);

// Evacuation Centers
router.get("/:orgId/centers", organizationController.getEvacuationCenters);
router.post("/:orgId/centers", organizationController.createEvacuationCenter);
router.put(
  "/:orgId/centers/:centerId",
  organizationController.updateEvacuationCenter
);
router.delete(
  "/:orgId/centers/:centerId",
  organizationController.deleteEvacuationCenter
);
// Reports
router.get("/:orgId/reports", organizationController.getReports);
router.post("/:orgId/reports", organizationController.createReport);

// Resources
router.get("/:orgId/resources", organizationController.getResources);
router.put(
  "/:orgId/resources/:resourceId",
  organizationController.updateResource
);

// Volunteers
router.get("/:orgId/volunteers", organizationController.getVolunteers);
router.put(
  "/:orgId/volunteers/:volunteerId/status",
  organizationController.updateVolunteerStatus
);

// Metrics
router.get("/:orgId/metrics", organizationController.getOrganizationMetrics);

export default router;
