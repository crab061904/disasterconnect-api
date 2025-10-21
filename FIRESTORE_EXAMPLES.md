# Firestore Models - Quick Examples

## Testing Your Models

You can test these models directly in your code or create a test script.

### Example Test Script

Create a file `test-models.js` in your API-BACK folder:

```javascript
import { User, Disaster, Organization, HelpRequest } from "./src/models/index.js";

async function testModels() {
  try {
    console.log("Testing Firestore Models...\n");

    // 1. Create a test user
    console.log("1. Creating a user...");
    const user = new User({
      uid: "test-user-123",
      email: "test@example.com",
      displayName: "Test User",
      role: "user",
      location: { lat: 14.5995, lng: 120.9842, address: "Manila, Philippines" },
    });
    await user.save();
    console.log("✓ User created:", user.displayName);

    // 2. Create a test disaster
    console.log("\n2. Creating a disaster...");
    const disaster = new Disaster({
      title: "Test Earthquake",
      description: "This is a test disaster report",
      type: "earthquake",
      severity: "high",
      location: { lat: 14.5995, lng: 120.9842, address: "Manila, Philippines" },
      reportedBy: user.uid,
    });
    await disaster.save();
    console.log("✓ Disaster created:", disaster.title);

    // 3. Get the disaster back
    console.log("\n3. Fetching disaster by ID...");
    const fetchedDisaster = await Disaster.getById(disaster.id);
    console.log("✓ Disaster fetched:", fetchedDisaster.title);

    // 4. Update the disaster
    console.log("\n4. Updating disaster status...");
    fetchedDisaster.status = "monitoring";
    await fetchedDisaster.save();
    console.log("✓ Disaster status updated to:", fetchedDisaster.status);

    // 5. Create a help request
    console.log("\n5. Creating a help request...");
    const helpRequest = new HelpRequest({
      disasterId: disaster.id,
      requestedBy: user.uid,
      title: "Need medical supplies",
      description: "Urgent need for first aid kits",
      urgency: "high",
      type: "medical",
      location: { lat: 14.5995, lng: 120.9842, address: "Manila, Philippines" },
      contactInfo: { phone: "+639123456789" },
    });
    await helpRequest.save();
    console.log("✓ Help request created:", helpRequest.title);

    // 6. Get active disasters
    console.log("\n6. Fetching active disasters...");
    const activeDisasters = await Disaster.getActive(10);
    console.log(`✓ Found ${activeDisasters.length} active disasters`);

    // 7. Get pending help requests
    console.log("\n7. Fetching pending help requests...");
    const pendingRequests = await HelpRequest.getPending(10);
    console.log(`✓ Found ${pendingRequests.length} pending help requests`);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the tests
testModels();
```

Run it with:
```bash
node test-models.js
```

---

## API Endpoint Examples

Once you set up the routes, you can test with these API calls:

### 1. Create a Disaster (POST)
```bash
POST http://localhost:3000/api/disasters
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "title": "Typhoon Yolanda",
  "description": "Category 5 super typhoon",
  "type": "typhoon",
  "severity": "critical",
  "location": {
    "lat": 11.2403,
    "lng": 125.0042,
    "address": "Tacloban City, Philippines"
  },
  "casualties": {
    "injured": 50,
    "deceased": 10,
    "missing": 5
  },
  "needsHelp": ["food", "water", "medical supplies", "shelter"]
}
```

### 2. Get Active Disasters (GET)
```bash
GET http://localhost:3000/api/disasters/active?limit=20
```

### 3. Get Nearby Disasters (GET)
```bash
GET http://localhost:3000/api/disasters/nearby?lat=14.5995&lng=120.9842&radius=50
```

### 4. Get Disaster by ID (GET)
```bash
GET http://localhost:3000/api/disasters/DISASTER_ID
```

### 5. Update Disaster Status (PATCH)
```bash
PATCH http://localhost:3000/api/disasters/DISASTER_ID/status
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "status": "resolved"
}
```

### 6. Verify Disaster (Admin only) (PATCH)
```bash
PATCH http://localhost:3000/api/disasters/DISASTER_ID/verify
Authorization: Bearer YOUR_JWT_TOKEN
```

### 7. Delete Disaster (DELETE)
```bash
DELETE http://localhost:3000/api/disasters/DISASTER_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Using Models in Your Code

### In a Controller
```javascript
import { Disaster, User, HelpRequest } from "../models/index.js";

// Create
const disaster = new Disaster({ title: "...", ... });
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

### In a Route Handler
```javascript
router.post("/disasters", async (req, res) => {
  const disaster = new Disaster(req.body);
  await disaster.save();
  res.json({ success: true, data: disaster });
});
```

---

## Common Patterns

### 1. Check if exists before creating
```javascript
const existingUser = await User.getByEmail(email);
if (existingUser) {
  throw new Error("User already exists");
}
```

### 2. Pagination
```javascript
// Get first page
const disasters = await Disaster.getActive(10);

// Get next page (you'll need to implement this)
const lastDoc = disasters[disasters.length - 1];
// Use startAfter in Firestore query
```

### 3. Filtering and sorting
```javascript
// In your model, add custom query methods
static async getByStatus(status, limit = 20) {
  const snapshot = await firestore
    .collection("disasters")
    .where("status", "==", status)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(doc => Disaster.fromFirestore(doc));
}
```

### 4. Relationships
```javascript
// Get disaster with user info
const disaster = await Disaster.getById("disaster123");
const reporter = await User.getById(disaster.reportedBy);

console.log(`Disaster reported by: ${reporter.displayName}`);
```

---

## Tips

1. **Always validate data** before saving to Firestore
2. **Use try-catch blocks** to handle errors gracefully
3. **Add indexes** in Firebase Console for complex queries
4. **Use transactions** for operations that need to be atomic
5. **Set up security rules** in Firebase Console to protect your data
6. **Monitor usage** in Firebase Console to stay within free tier limits

---

## Next Steps

1. ✅ Models created
2. ✅ Example controller created
3. ✅ Example routes created
4. ⬜ Add more controllers (User, Organization, HelpRequest)
5. ⬜ Set up authentication middleware
6. ⬜ Connect routes to your main server file
7. ⬜ Set up Firestore security rules
8. ⬜ Test with Postman or similar tool
