import { firestore } from "../firebaseAdmin.js";
import { EvacuationCenter, Announcement, Resource, Report } from "../models/index.js";
import { BaseController } from "./BaseController.js";

export const organizationController = {
  
  // ================= EVACUATION CENTERS =================
  async createCenter(req, res) {
    try {
      const orgId = req.user.uid; 
      const id = await EvacuationCenter.create(orgId, req.body);
      return BaseController.success(res, { id }, "Evacuation Center created", 201);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async getCenters(req, res) {
    try {
      const orgId = req.user.uid;
      const centers = await EvacuationCenter.getAllByOrganization(orgId);
      return BaseController.success(res, centers);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // !!! ENSURE THIS EXISTS !!!
  async updateCenter(req, res) {
    try {
      const orgId = req.user.uid;
      const { id } = req.params;
      await firestore.collection('organizations').doc(orgId).collection('centers').doc(id).update({
        ...req.body,
        updatedAt: new Date()
      });
      return BaseController.success(res, { id }, "Evacuation Center updated");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // !!! ENSURE THIS EXISTS !!!
  async deleteCenter(req, res) {
    try {
      const orgId = req.user.uid;
      const { id } = req.params;
      await firestore.collection('organizations').doc(orgId).collection('centers').doc(id).delete();
      return BaseController.success(res, { id }, "Evacuation Center deleted");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // ================= ANNOUNCEMENTS =================
  async createAnnouncement(req, res) {
    try {
      const orgId = req.user.uid;
      const announcementData = {
        title: req.body.title,
        body: req.body.body,
        status: req.body.status || 'Published',
        createdBy: req.user.uid
      };

      if (!announcementData.title || !announcementData.body) {
        return BaseController.error(res, "Title and Body are required", 400);
      }

      const id = await Announcement.create(orgId, announcementData);
      return BaseController.success(res, { id }, "Announcement published", 201);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async getAnnouncements(req, res) {
    try {
      const orgId = req.user.uid;
      const data = await Announcement.getAllByOrganization(orgId);
      return BaseController.success(res, data);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async updateAnnouncement(req, res) {
    try {
      const orgId = req.user.uid;
      const { id } = req.params;
      await firestore.collection('organizations').doc(orgId).collection('announcements').doc(id).update({
        ...req.body,
        updatedAt: new Date()
      });
      return BaseController.success(res, { id }, "Announcement updated");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async deleteAnnouncement(req, res) {
    try {
      const orgId = req.user.uid;
      const { id } = req.params;
      await firestore.collection('organizations').doc(orgId).collection('announcements').doc(id).delete();
      return BaseController.success(res, { id }, "Announcement deleted");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // ================= RESOURCES =================
  async addResource(req, res) {
    try {
      const orgId = req.user.uid;
      const resourceData = { ...req.body, organizationId: orgId };
      const id = await Resource.create(orgId, resourceData);
      return BaseController.success(res, { id }, "Resource added", 201);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async getResources(req, res) {
    try {
      const orgId = req.user.uid;
      const data = await Resource.getByOrg(orgId);
      return BaseController.success(res, data);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async updateResource(req, res) {
    try {
      const orgId = req.user.uid;
      const { id } = req.params;
      // Using Resource Model static update if available, or direct firestore here:
      await firestore.collection('organizations').doc(orgId).collection('resources').doc(id).update({
        ...req.body,
        updatedAt: new Date()
      });
      return BaseController.success(res, { id }, "Resource updated");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async deleteResource(req, res) {
    try {
      const orgId = req.user.uid;
      const { id } = req.params;
      await firestore.collection('organizations').doc(orgId).collection('resources').doc(id).delete();
      return BaseController.success(res, { id }, "Resource deleted");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  // ================= REPORTS =================
  async createReport(req, res) {
    try {
      const orgId = req.user.uid;
      const reportData = {
        ...req.body,
        author: req.user.email,
        status: req.body.status || 'Pending'
      };
      const id = await Report.create(orgId, reportData);
      return BaseController.success(res, { id }, "Report generated", 201);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async getReports(req, res) {
    try {
      const orgId = req.user.uid;
      const data = await Report.getByOrg(orgId);
      return BaseController.success(res, data);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async updateReport(req, res) {
    try {
      const orgId = req.user.uid;
      const { id } = req.params;
      await firestore.collection('organizations').doc(orgId).collection('reports').doc(id).update(req.body);
      return BaseController.success(res, { id }, "Report updated");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async deleteReport(req, res) {
    try {
      const orgId = req.user.uid;
      const { id } = req.params;
      await firestore.collection('organizations').doc(orgId).collection('reports').doc(id).delete();
      return BaseController.success(res, { id }, "Report deleted");
    } catch (error) { return BaseController.error(res, error.message); }
  },
  
  // ================= VOLUNTEERS & TASKS =================
  async getOrgVolunteers(req, res) {
    try {
      const orgId = req.user.uid;
      const snap = await firestore.collection('organizations').doc(orgId).collection('volunteers').get();
      const volunteers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, volunteers);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async assignTask(req, res) {
    try {
      const orgId = req.user.uid;
      const { volunteerId, title, description, priority, dueDate, location, requiredSkills } = req.body;

      if (!volunteerId || !title) return BaseController.error(res, "Volunteer ID and Title are required", 400);

      const orgDoc = await firestore.collection('organizations').doc(orgId).get();
      const orgName = orgDoc.exists ? orgDoc.data().name : "Unknown Org";

      const assignmentData = {
        title,
        description: description || "",
        organizationId: orgId,
        organizationName: orgName,
        assignedDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "Pending",
        priority: priority || "Medium",
        location: location || "",
        requiredSkills: requiredSkills || [],
        createdAt: new Date()
      };

      const docRef = await firestore.collection('volunteers').doc(volunteerId).collection('assignments').add(assignmentData);

      return BaseController.success(res, { id: docRef.id, ...assignmentData }, "Task assigned successfully", 201);
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async deleteAssignment(req, res) {
    try {
      const { volunteerId, assignmentId } = req.params;
      await firestore.collection('volunteers').doc(volunteerId).collection('assignments').doc(assignmentId).delete();
      return BaseController.success(res, { id: assignmentId }, "Assignment deleted");
    } catch (error) { return BaseController.error(res, error.message); }
  },

  async postNeed(req, res) {
    try {
      const orgId = req.user.uid;
      const { title, description, location, urgency, volunteersNeeded, skillsRequired } = req.body;

      const needData = {
        title,
        description,
        location: location || {}, 
        urgency: urgency || "Medium",
        volunteersNeeded: volunteersNeeded || 1,
        volunteersAssigned: 0,
        skillsRequired: skillsRequired || [],
        status: "Open",
        organizationId: orgId,
        createdAt: new Date()
      };

      const docRef = await firestore.collection('organizations').doc(orgId).collection('needs').add(needData);
      return BaseController.success(res, { id: docRef.id, ...needData }, "Need posted successfully", 201);
    } catch (error) { return BaseController.error(res, error.message); }
  }
};