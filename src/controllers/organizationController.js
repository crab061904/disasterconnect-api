import { firestore } from "../firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

class OrganizationController {
  // Organization CRUD
  async createOrganization(req, res) {
    try {
      const {
        name,
        email,
        type,
        description,
        phone,
        website,
        location,
        serviceArea,
      } = req.body;
      const { uid } = req.user;

      // Validate required fields
      if (!name || !email || !type) {
        return res.status(400).json({
          error: "Name, email, and type are required fields",
        });
      }

      const orgData = {
        name,
        email,
        type: type.toLowerCase(),
        description: description || "",
        phone: phone || "",
        website: website || "",
        location: location || null,
        serviceArea: serviceArea || [],
        adminUid: uid,
        members: [uid],
        isVerified: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const orgRef = await firestore.collection("organizations").add(orgData);

      res.status(201).json({
        id: orgRef.id,
        message: "Organization created successfully",
        organization: {
          id: orgRef.id,
          ...orgData,
        },
      });
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  }

  // Announcements
  async getAnnouncements(req, res) {
    try {
      const { orgId } = req.params;
      const snapshot = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("announcements")
        .orderBy("createdAt", "desc")
        .get();

      const announcements = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        announcements.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          date: data.date?.toDate(),
        });
      });

      res.json(announcements);
    } catch (error) {
      console.error("Error getting announcements:", error);
      res.status(500).json({ error: "Failed to get announcements" });
    }
  }

  async createAnnouncement(req, res) {
    try {
      const { orgId } = req.params;
      const { title, body, status = "draft" } = req.body;
      const { uid } = req.user;

      if (!title || !body) {
        return res.status(400).json({
          error: "Title and body are required",
        });
      }

      const announcementData = {
        title,
        body,
        status: status.toLowerCase(),
        createdBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const announcementRef = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("announcements")
        .add(announcementData);

      res.status(201).json({
        id: announcementRef.id,
        message: "Announcement created successfully",
        announcement: {
          id: announcementRef.id,
          ...announcementData,
        },
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  }

  // Evacuation Centers
  async getEvacuationCenters(req, res) {
    try {
      const { orgId } = req.params;
      const snapshot = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("centers")
        .orderBy("createdAt", "desc")
        .get();

      const centers = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        centers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
        });
      });

      res.json(centers);
    } catch (error) {
      console.error("Error getting evacuation centers:", error);
      res.status(500).json({ error: "Failed to get evacuation centers" });
    }
  }

  async createEvacuationCenter(req, res) {
    try {
      const { orgId } = req.params;
      const {
        name,
        address,
        head,
        contact,
        capacity,
        occupied = 0,
        lat,
        lng,
      } = req.body;

      if (!name || !address || !capacity) {
        return res.status(400).json({
          error: "Name, address, and capacity are required",
        });
      }

      const centerData = {
        name,
        address,
        head: head || "",
        contact: contact || "",
        capacity: Number(capacity),
        occupied: Number(occupied),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const centerRef = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("centers")
        .add(centerData);

      res.status(201).json({
        id: centerRef.id,
        message: "Evacuation center created successfully",
        center: {
          id: centerRef.id,
          ...centerData,
        },
      });
    } catch (error) {
      console.error("Error creating evacuation center:", error);
      res.status(500).json({ error: "Failed to create evacuation center" });
    }
  }

  // Add this method to OrganizationController class
  async updateEvacuationCenter(req, res) {
    try {
      const { orgId, centerId } = req.params;
      const { name, address, head, contact, capacity, occupied, lat, lng } =
        req.body;

      const updateData = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Only update fields that are provided in the request
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (head !== undefined) updateData.head = head;
      if (contact !== undefined) updateData.contact = contact;
      if (capacity !== undefined) updateData.capacity = Number(capacity);
      if (occupied !== undefined) updateData.occupied = Number(occupied);
      if (lat !== undefined) updateData.lat = lat ? Number(lat) : null;
      if (lng !== undefined) updateData.lng = lng ? Number(lng) : null;

      await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("centers")
        .doc(centerId)
        .update(updateData);

      // Get the updated document
      const updatedDoc = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("centers")
        .doc(centerId)
        .get();

      if (!updatedDoc.exists) {
        return res.status(404).json({ error: "Evacuation center not found" });
      }

      const updatedData = updatedDoc.data();

      res.json({
        message: "Evacuation center updated successfully",
        center: {
          id: updatedDoc.id,
          ...updatedData,
          // Convert Firestore timestamps to Date objects
          createdAt: updatedData.createdAt?.toDate(),
          updatedAt: updatedData.updatedAt?.toDate(),
        },
      });
    } catch (error) {
      console.error("Error updating evacuation center:", error);
      res.status(500).json({ error: "Failed to update evacuation center" });
    }
  }

  async deleteEvacuationCenter(req, res) {
    try {
      const { orgId, centerId } = req.params;

      // First check if the document exists
      const docRef = firestore
        .collection("organizations")
        .doc(orgId)
        .collection("centers")
        .doc(centerId);

      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Evacuation center not found" });
      }

      // Delete the document
      await docRef.delete();

      res.json({
        message: "Evacuation center deleted successfully",
        centerId,
      });
    } catch (error) {
      console.error("Error deleting evacuation center:", error);
      res.status(500).json({ error: "Failed to delete evacuation center" });
    }
  }

  // Reports
  async getReports(req, res) {
    try {
      const { orgId } = req.params;
      const snapshot = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("reports")
        .orderBy("createdAt", "desc")
        .get();

      const reports = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          date: data.date?.toDate(),
        });
      });

      res.json(reports);
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  }

  async createReport(req, res) {
    try {
      const { orgId } = req.params;
      const { title, content, status = "pending", type = "general" } = req.body;
      const { uid, name } = req.user;

      if (!title || !content) {
        return res.status(400).json({
          error: "Title and content are required",
        });
      }

      const reportData = {
        title,
        content,
        status: status.toLowerCase(),
        type: type.toLowerCase(),
        author: name || "Unknown",
        authorUid: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const reportRef = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("reports")
        .add(reportData);

      res.status(201).json({
        id: reportRef.id,
        message: "Report created successfully",
        report: {
          id: reportRef.id,
          ...reportData,
        },
      });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  }

  // Resources
  async getResources(req, res) {
    try {
      const { orgId } = req.params;
      const snapshot = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("resources")
        .orderBy("updatedAt", "desc")
        .get();

      const resources = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        resources.push({
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        });
      });

      res.json(resources);
    } catch (error) {
      console.error("Error getting resources:", error);
      res.status(500).json({ error: "Failed to get resources" });
    }
  }

  async updateResource(req, res) {
    try {
      const { orgId, resourceId } = req.params;
      const { quantity, name, unit, category } = req.body;

      const updateData = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (quantity !== undefined) updateData.quantity = Number(quantity);
      if (name) updateData.name = name;
      if (unit) updateData.unit = unit;
      if (category) updateData.category = category;

      await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("resources")
        .doc(resourceId)
        .update(updateData);

      res.json({
        message: "Resource updated successfully",
        resourceId,
        updates: updateData,
      });
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ error: "Failed to update resource" });
    }
  }

  // Volunteers
  async getVolunteers(req, res) {
    try {
      const { orgId } = req.params;
      const snapshot = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("volunteers")
        .orderBy("updatedAt", "desc")
        .get();

      const volunteers = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        volunteers.push({
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        });
      });

      res.json(volunteers);
    } catch (error) {
      console.error("Error getting volunteers:", error);
      res.status(500).json({ error: "Failed to get volunteers" });
    }
  }

  async updateVolunteerStatus(req, res) {
    try {
      const { orgId, volunteerId } = req.params;
      const { status } = req.body;

      const validStatuses = ["active", "on_duty", "standby", "inactive"];
      if (!validStatuses.includes(status?.toLowerCase())) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("volunteers")
        .doc(volunteerId)
        .update({
          status: status.toLowerCase(),
          updatedAt: FieldValue.serverTimestamp(),
        });

      res.json({
        message: "Volunteer status updated successfully",
        volunteerId,
        status: status.toLowerCase(),
      });
    } catch (error) {
      console.error("Error updating volunteer status:", error);
      res.status(500).json({ error: "Failed to update volunteer status" });
    }
  }

  // Organization Metrics
  async getOrganizationMetrics(req, res) {
    try {
      const { orgId } = req.params;

      // Get counts for all collections
      const [
        announcementsSnapshot,
        centersSnapshot,
        reportsSnapshot,
        resourcesSnapshot,
        volunteersSnapshot,
      ] = await Promise.all([
        firestore
          .collection("organizations")
          .doc(orgId)
          .collection("announcements")
          .count()
          .get(),
        firestore
          .collection("organizations")
          .doc(orgId)
          .collection("centers")
          .count()
          .get(),
        firestore
          .collection("organizations")
          .doc(orgId)
          .collection("reports")
          .count()
          .get(),
        firestore
          .collection("organizations")
          .doc(orgId)
          .collection("resources")
          .count()
          .get(),
        firestore
          .collection("organizations")
          .doc(orgId)
          .collection("volunteers")
          .count()
          .get(),
      ]);

      // Calculate evacuation center statistics
      const centers = [];
      const centersQuery = await firestore
        .collection("organizations")
        .doc(orgId)
        .collection("centers")
        .get();

      centersQuery.forEach((doc) => {
        const data = doc.data();
        centers.push({
          capacity: data.capacity || 0,
          occupied: data.occupied || 0,
        });
      });

      const totalCapacity = centers.reduce(
        (sum, center) => sum + center.capacity,
        0
      );
      const totalOccupied = centers.reduce(
        (sum, center) => sum + center.occupied,
        0
      );

      res.json({
        announcements: announcementsSnapshot.data().count,
        centers: centersSnapshot.data().count,
        reports: reportsSnapshot.data().count,
        resources: resourcesSnapshot.data().count,
        volunteers: volunteersSnapshot.data().count,
        evacuationCenters: {
          total: centersSnapshot.data().count,
          totalCapacity,
          totalOccupied,
          availableCapacity: totalCapacity - totalOccupied,
          occupancyRate:
            totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0,
        },
      });
    } catch (error) {
      console.error("Error getting organization metrics:", error);
      res.status(500).json({ error: "Failed to get organization metrics" });
    }
  }
}

export default new OrganizationController();
