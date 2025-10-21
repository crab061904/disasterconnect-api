# Firestore Data Models - Summary

## ✅ What Was Created

### 📁 Models (`src/models/`)
1. **User.js** - User accounts (regular users, volunteers, admins)
2. **Disaster.js** - Disaster events and reports
3. **Organization.js** - NGOs, government agencies, rescue teams
4. **HelpRequest.js** - Help requests from people during disasters
5. **index.js** - Exports all models for easy importing

### 📁 Controllers (`src/controllers/`)
1. **disasterController.js** - Complete CRUD operations for disasters
2. **index.js** - Updated to export disasterController

### 📁 Routes (`src/routes/`)
1. **disasterRoutes.js** - API routes for disaster endpoints

### 📁 Documentation
1. **FIRESTORE_MODELS_GUIDE.md** - Complete guide on how to use the models
2. **FIRESTORE_EXAMPLES.md** - Code examples and API endpoint examples
3. **MODELS_SUMMARY.md** - This file

---

## 🚀 Quick Start

### 1. Import and use a model:
```javascript
import { User, Disaster, HelpRequest } from "./models/index.js";

// Create
const disaster = new Disaster({
  title: "Earthquake in Manila",
  type: "earthquake",
  severity: "high",
  location: { lat: 14.5995, lng: 120.9842, address: "Manila" },
  reportedBy: "user123"
});
await disaster.save();

// Read
const disaster = await Disaster.getById("disaster123");
const activeDisasters = await Disaster.getActive(20);

// Update
disaster.status = "resolved";
await disaster.save();

// Delete
await disaster.delete();
```

### 2. Use in your server:
```javascript
// In your server.js or app.js
import disasterRoutes from "./routes/disasterRoutes.js";

app.use("/api/disasters", disasterRoutes);
```

---

## 📊 Firestore Collections

Your database will have these collections:

```
📦 Firestore Database
 ├── 👥 users/
 │   └── {userId}/
 │       ├── uid
 │       ├── email
 │       ├── displayName
 │       ├── role
 │       └── ...
 │
 ├── 🌪️ disasters/
 │   └── {disasterId}/
 │       ├── title
 │       ├── type
 │       ├── severity
 │       ├── location
 │       └── ...
 │
 ├── 🏢 organizations/
 │   └── {orgId}/
 │       ├── name
 │       ├── type
 │       ├── members
 │       └── ...
 │
 └── 🆘 help_requests/
     └── {requestId}/
         ├── disasterId
         ├── urgency
         ├── status
         └── ...
```

---

## 🔑 Key Concepts

### Firestore is NoSQL
- No strict schema (but our models provide structure)
- Documents stored in collections
- References stored as strings (UIDs)

### Models Provide Structure
```javascript
// Without model (inconsistent)
await firestore.collection("disasters").add({
  name: "Earthquake",  // Oops, should be "title"
  level: "high"        // Oops, should be "severity"
});

// With model (consistent)
const disaster = new Disaster({
  title: "Earthquake",
  severity: "high"
});
await disaster.save();
```

### CRUD Operations
- **Create**: `new Model(data)` → `await model.save()`
- **Read**: `await Model.getById(id)`, `await Model.getActive()`
- **Update**: `model.field = value` → `await model.save()`
- **Delete**: `await model.delete()`

---

## 📋 Available Methods

### User Model
- `await user.save()` - Save/update user
- `await User.getById(uid)` - Get by ID
- `await User.getByEmail(email)` - Get by email
- `await user.update(updates)` - Update fields
- `await user.delete()` - Delete user
- `await User.getAll(limit)` - Get all users

### Disaster Model
- `await disaster.save()` - Save/update disaster
- `await Disaster.getById(id)` - Get by ID
- `await Disaster.getActive(limit)` - Get active disasters
- `await Disaster.getByType(type)` - Get by type
- `await Disaster.getByLocation(lat, lng, radius)` - Get nearby
- `await disaster.delete()` - Delete disaster

### Organization Model
- `await org.save()` - Save/update organization
- `await Organization.getById(id)` - Get by ID
- `await Organization.getByType(type)` - Get by type
- `await org.addMember(uid)` - Add member
- `await org.removeMember(uid)` - Remove member
- `await org.delete()` - Delete organization

### HelpRequest Model
- `await request.save()` - Save/update request
- `await HelpRequest.getById(id)` - Get by ID
- `await HelpRequest.getByDisaster(disasterId)` - Get by disaster
- `await HelpRequest.getPending()` - Get pending requests
- `await request.assignTo(uid)` - Assign to volunteer/org
- `await request.markFulfilled()` - Mark as fulfilled
- `await request.delete()` - Delete request

---

## 🛣️ API Endpoints (Disaster)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/disasters/active` | Get active disasters | No |
| GET | `/api/disasters/nearby?lat=X&lng=Y` | Get nearby disasters | No |
| GET | `/api/disasters/type/:type` | Get by type | No |
| GET | `/api/disasters/:id` | Get by ID | No |
| POST | `/api/disasters` | Create disaster | Yes |
| PUT | `/api/disasters/:id` | Update disaster | Yes |
| PATCH | `/api/disasters/:id/status` | Update status | Yes |
| PATCH | `/api/disasters/:id/verify` | Verify (admin) | Yes |
| DELETE | `/api/disasters/:id` | Delete disaster | Yes |

---

## ⚡ Next Steps

### 1. Connect Routes to Server
In your `server.js`:
```javascript
import disasterRoutes from "./src/routes/disasterRoutes.js";

app.use("/api/disasters", disasterRoutes);
```

### 2. Test the API
Use Postman, Thunder Client, or curl:
```bash
# Get active disasters
curl http://localhost:3000/api/disasters/active

# Create disaster (with auth token)
curl -X POST http://localhost:3000/api/disasters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","type":"earthquake","severity":"high",...}'
```

### 3. Create More Controllers
- userController.js
- organizationController.js
- helpRequestController.js

### 4. Set Up Firestore Security Rules
In Firebase Console → Firestore → Rules

### 5. Add Validation
Use a library like `joi` or `express-validator` to validate request data

---

## 📚 Resources

- **FIRESTORE_MODELS_GUIDE.md** - Detailed guide with examples
- **FIRESTORE_EXAMPLES.md** - Code snippets and API examples
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## 💡 Tips

1. **Always use try-catch** in async functions
2. **Validate data** before saving to Firestore
3. **Use transactions** for atomic operations
4. **Add indexes** for complex queries (in Firebase Console)
5. **Monitor usage** to stay within free tier
6. **Set security rules** to protect your data

---

## ❓ Need Help?

Check the documentation files:
- `FIRESTORE_MODELS_GUIDE.md` - How to use models
- `FIRESTORE_EXAMPLES.md` - Code examples

Or refer to the inline comments in the model files!
