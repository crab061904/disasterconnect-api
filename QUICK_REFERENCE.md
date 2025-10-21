# 🚀 Firestore Models - Quick Reference Card

## 📦 Import Models
```javascript
import { User, Disaster, Organization, HelpRequest } from "./src/models/index.js";
```

## ⚡ Common Operations

### Create & Save
```javascript
const disaster = new Disaster({
  title: "Earthquake",
  type: "earthquake",
  severity: "high",
  location: { lat: 14.5995, lng: 120.9842, address: "Manila" },
  reportedBy: "user123"
});
await disaster.save();
```

### Get by ID
```javascript
const disaster = await Disaster.getById("disaster123");
const user = await User.getById("user123");
```

### Get Multiple
```javascript
const activeDisasters = await Disaster.getActive(20);
const pendingRequests = await HelpRequest.getPending(50);
const organizations = await Organization.getByType("ngo", 20);
```

### Update
```javascript
disaster.status = "resolved";
await disaster.save();
// OR
await disaster.update({ status: "resolved" });
```

### Delete
```javascript
await disaster.delete();
```

---

## 🌐 API Endpoints

### Disasters
```
GET    /api/disasters/active          - Get active disasters
GET    /api/disasters/nearby          - Get nearby (lat, lng, radius)
GET    /api/disasters/type/:type      - Get by type
GET    /api/disasters/:id             - Get by ID
POST   /api/disasters                 - Create (auth required)
PUT    /api/disasters/:id             - Update (auth required)
PATCH  /api/disasters/:id/status      - Update status (auth required)
PATCH  /api/disasters/:id/verify      - Verify (admin only)
DELETE /api/disasters/:id             - Delete (auth required)
```

---

## 📋 Model Fields

### User
```javascript
{
  uid: "string",
  email: "string",
  displayName: "string",
  phoneNumber: "string",
  role: "user|volunteer|admin|organization",
  profilePicture: "url",
  location: { lat, lng, address },
  isVerified: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Disaster
```javascript
{
  id: "string",
  title: "string",
  description: "string",
  type: "earthquake|flood|fire|typhoon|etc",
  severity: "low|medium|high|critical",
  status: "active|resolved|monitoring",
  location: { lat, lng, address, city, region },
  reportedBy: "uid",
  verifiedBy: "uid",
  isVerified: boolean,
  images: ["url"],
  casualties: { injured, deceased, missing },
  needsHelp: ["resource"],
  createdAt: Date,
  updatedAt: Date
}
```

### HelpRequest
```javascript
{
  id: "string",
  disasterId: "string",
  requestedBy: "uid",
  title: "string",
  description: "string",
  urgency: "low|medium|high|critical",
  status: "pending|in_progress|fulfilled|cancelled",
  type: "rescue|medical|food|water|shelter|etc",
  location: { lat, lng, address },
  contactInfo: { phone, alternateContact },
  numberOfPeople: number,
  assignedTo: "uid",
  images: ["url"],
  createdAt: Date,
  updatedAt: Date,
  fulfilledAt: Date
}
```

### Organization
```javascript
{
  id: "string",
  name: "string",
  type: "ngo|government|rescue_team|medical|etc",
  description: "string",
  email: "string",
  phone: "string",
  website: "url",
  logo: "url",
  location: { lat, lng, address },
  serviceArea: ["city/region"],
  resources: ["resource"],
  adminUid: "uid",
  members: ["uid"],
  isVerified: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 Controller Example
```javascript
import { Disaster } from "../models/index.js";

export const disasterController = {
  async createDisaster(req, res) {
    try {
      const disaster = new Disaster({
        ...req.body,
        reportedBy: req.user.uid
      });
      await disaster.save();
      res.status(201).json({ success: true, data: disaster });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
```

---

## 🛣️ Route Example
```javascript
import express from "express";
import { disasterController } from "../controllers/index.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/active", disasterController.getActiveDisasters);
router.post("/", verifyToken, disasterController.createDisaster);

export default router;
```

---

## 🧪 Test with cURL

### Get Active Disasters
```bash
curl http://localhost:5000/api/disasters/active
```

### Create Disaster (with auth)
```bash
curl -X POST http://localhost:5000/api/disasters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Earthquake",
    "description": "Test description",
    "type": "earthquake",
    "severity": "high",
    "location": {
      "lat": 14.5995,
      "lng": 120.9842,
      "address": "Manila, Philippines"
    }
  }'
```

---

## 📚 Documentation Files

- **MODELS_SUMMARY.md** - Overview and quick start
- **FIRESTORE_MODELS_GUIDE.md** - Complete guide
- **FIRESTORE_EXAMPLES.md** - Code examples
- **QUICK_REFERENCE.md** - This file

---

## ✅ Setup Checklist

- [x] Models created (`src/models/`)
- [x] Controllers created (`src/controllers/disasterController.js`)
- [x] Routes created (`src/routes/disasterRoutes.js`)
- [x] Routes connected to server (`server.js`)
- [ ] Test API endpoints
- [ ] Create more controllers (User, Organization, HelpRequest)
- [ ] Set up Firestore security rules
- [ ] Add data validation
- [ ] Deploy to production

---

## 💡 Pro Tips

1. Always wrap async operations in try-catch
2. Validate data before saving to Firestore
3. Use transactions for atomic operations
4. Add indexes for complex queries
5. Monitor Firestore usage in Firebase Console
6. Set up security rules to protect data
