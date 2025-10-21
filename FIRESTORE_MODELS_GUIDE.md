# Firestore Data Models Guide

## Overview
This guide explains how to use the Firestore data models in your DisasterConnect application.

## Models Created

### 1. **User Model** (`models/User.js`)
Represents users in the system (regular users, volunteers, admins, organizations).

**Fields:**
- `uid` - User ID (from Firebase Auth)
- `email` - User email
- `displayName` - User's display name
- `phoneNumber` - Contact number
- `role` - user, volunteer, admin, organization
- `profilePicture` - URL to profile image
- `location` - { lat, lng, address }
- `isVerified` - Boolean
- `createdAt`, `updatedAt` - Timestamps

### 2. **Disaster Model** (`models/Disaster.js`)
Represents disaster events.

**Fields:**
- `title` - Disaster title
- `description` - Details
- `type` - earthquake, flood, fire, typhoon, etc.
- `severity` - low, medium, high, critical
- `status` - active, resolved, monitoring
- `location` - { lat, lng, address, city, region }
- `reportedBy` - User UID who reported
- `isVerified` - Boolean
- `images` - Array of image URLs
- `casualties` - { injured, deceased, missing }
- `needsHelp` - Array of needed resources

### 3. **Organization Model** (`models/Organization.js`)
Represents NGOs, government agencies, rescue teams.

**Fields:**
- `name` - Organization name
- `type` - ngo, government, rescue_team, medical
- `description` - About the organization
- `email`, `phone`, `website` - Contact info
- `location` - Headquarters location
- `serviceArea` - Array of cities/regions served
- `resources` - Available resources
- `members` - Array of user UIDs

### 4. **HelpRequest Model** (`models/HelpRequest.js`)
Represents help requests from people during disasters.

**Fields:**
- `disasterId` - Reference to disaster
- `requestedBy` - User UID
- `title`, `description` - Request details
- `urgency` - low, medium, high, critical
- `status` - pending, in_progress, fulfilled, cancelled
- `type` - rescue, medical, food, water, shelter
- `location` - Where help is needed
- `contactInfo` - { phone, alternateContact }
- `assignedTo` - Organization/volunteer UID

---

## How to Use the Models

### Basic CRUD Operations

#### **Create a new record:**
```javascript
import { User, Disaster, HelpRequest } from "./models/index.js";

// Create a new user
const user = new User({
  uid: "user123",
  email: "john@example.com",
  displayName: "John Doe",
  role: "user",
});
await user.save();

// Create a new disaster
const disaster = new Disaster({
  title: "Earthquake in Manila",
  description: "7.2 magnitude earthquake",
  type: "earthquake",
  severity: "critical",
  location: { lat: 14.5995, lng: 120.9842, address: "Manila, Philippines" },
  reportedBy: "user123",
});
await disaster.save();
```

#### **Read/Get records:**
```javascript
// Get user by ID
const user = await User.getById("user123");

// Get user by email
const user = await User.getByEmail("john@example.com");

// Get disaster by ID
const disaster = await Disaster.getById("disaster123");

// Get active disasters
const activeDisasters = await Disaster.getActive(20);

// Get disasters by type
const earthquakes = await Disaster.getByType("earthquake");

// Get pending help requests
const pendingRequests = await HelpRequest.getPending(50);
```

#### **Update records:**
```javascript
// Get user and update
const user = await User.getById("user123");
await user.update({
  displayName: "John Smith",
  phoneNumber: "+639123456789",
});

// Or update directly
user.displayName = "John Smith";
user.phoneNumber = "+639123456789";
await user.save();
```

#### **Delete records:**
```javascript
const user = await User.getById("user123");
await user.delete();
```

---

## Example Controller Usage

Here's how to use these models in a controller:

```javascript
// controllers/disasterController.js
import { Disaster } from "../models/index.js";

export const disasterController = {
  // Create a new disaster report
  async createDisaster(req, res) {
    try {
      const { title, description, type, severity, location } = req.body;
      const userId = req.user.uid; // from auth middleware

      const disaster = new Disaster({
        title,
        description,
        type,
        severity,
        location,
        reportedBy: userId,
      });

      await disaster.save();

      res.status(201).json({
        success: true,
        message: "Disaster reported successfully",
        data: disaster,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get all active disasters
  async getActiveDisasters(req, res) {
    try {
      const disasters = await Disaster.getActive(50);

      res.json({
        success: true,
        data: disasters,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get disaster by ID
  async getDisasterById(req, res) {
    try {
      const { id } = req.params;
      const disaster = await Disaster.getById(id);

      if (!disaster) {
        return res.status(404).json({
          success: false,
          message: "Disaster not found",
        });
      }

      res.json({
        success: true,
        data: disaster,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update disaster status
  async updateDisasterStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const disaster = await Disaster.getById(id);
      if (!disaster) {
        return res.status(404).json({
          success: false,
          message: "Disaster not found",
        });
      }

      disaster.status = status;
      await disaster.save();

      res.json({
        success: true,
        message: "Disaster status updated",
        data: disaster,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
```

---

## Firestore Collections Structure

Your Firestore database will have these collections:

```
/users/{userId}
/disasters/{disasterId}
/organizations/{organizationId}
/help_requests/{requestId}
```

---

## Important Notes

1. **No Schema Enforcement**: Firestore is NoSQL, so there's no strict schema. These models help maintain consistency.

2. **Timestamps**: Use JavaScript `Date` objects. Firestore will convert them to Timestamp objects.

3. **References**: Store UIDs as strings to reference other documents (e.g., `reportedBy: "user123"`).

4. **Geolocation**: For production, consider using GeoFirestore for efficient location-based queries.

5. **Indexes**: For complex queries (multiple `where` clauses), you may need to create composite indexes in Firebase Console.

6. **Security Rules**: Remember to set up Firestore security rules in the Firebase Console.

---

## Next Steps

1. Create controllers for each model
2. Set up routes to expose the API endpoints
3. Add authentication middleware to protect routes
4. Set up Firestore security rules
5. Add validation for incoming data

---

## Example Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Disasters collection
    match /disasters/{disasterId} {
      allow read: if true; // Public read
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.reportedBy 
                            || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Help requests
    match /help_requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.requestedBy 
                    || request.auth.uid == resource.data.assignedTo;
    }
  }
}
```
