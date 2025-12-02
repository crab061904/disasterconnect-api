import { firestore } from "../firebaseAdmin.js";
import { EvacuationCenter, Announcement, Resource, Report } from "../models/index.js";
import { BaseController } from "./BaseController.js";

export const organizationController = {
  
  // --- EVACUATION CENTERS ---
  async createCenter(req, res) {
    try {
      const orgId = req.user.uid; // Assuming the logged-in user IS the org
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

  // --- ANNOUNCEMENTS ---
  async createAnnouncement(req, res) {
    try {
      const orgId = req.user.uid;
      const id = await Announcement.create(orgId, req.body);
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

  // --- RESOURCES ---
  async addResource(req, res) {
    try {
      const orgId = req.user.uid;
      const id = await Resource.create(orgId, req.body);
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

  // --- REPORTS ---
  async createReport(req, res) {
    try {
      const orgId = req.user.uid;
      const id = await Report.create(orgId, { ...req.body, author: req.user.email });
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
  
  // --- VOLUNTEERS (View Only) ---
  async getOrgVolunteers(req, res) {
    try {
      const orgId = req.user.uid;
      // Get volunteers from sub-collection: organizations/{orgId}/volunteers
      const snap = await firestore.collection('organizations').doc(orgId).collection('volunteers').get();
      const volunteers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return BaseController.success(res, volunteers);
    } catch (error) { return BaseController.error(res, error.message); }
  }
};