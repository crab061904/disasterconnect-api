# Backend Cleanup Plan

## ❌ Files to Remove

### 1. Unused Code Files
- **`src/mockDatabase.js`** - Mock database not being used (you're using Firebase Firestore)
- **`index.js`** (root) - Firebase Functions setup, but you're using `server.js` for local dev
- **`api/index.js`** - Vercel serverless setup, but incomplete (missing disaster/help routes)

### 2. Redundant Documentation
- **`START_HERE.md`** - Overlaps with README.md and VERCEL_DEPLOY.md
- **`QUICK_REFERENCE.md`** - Outdated, overlaps with API_DOCUMENTATION.md
- **`MODELS_SUMMARY.md`** - Overlaps with FIRESTORE_MODELS_GUIDE.md
- **`FIRESTORE_EXAMPLES.md`** - Examples now in FIRESTORE_MODELS_GUIDE.md
- **`DEPLOYMENT.md`** - Overlaps with VERCEL_DEPLOY.md

### 3. Keep These Documentation Files
- ✅ **`README.md`** - Main entry point
- ✅ **`API_DOCUMENTATION.md`** - Complete API reference
- ✅ **`FIRESTORE_MODELS_GUIDE.md`** - Database models guide
- ✅ **`VERCEL_DEPLOY.md`** - Deployment instructions

## 🔧 Issues to Fix

### Critical: Missing Middleware File
**Problem:** Routes import `authMiddleware.js` but file doesn't exist
- `disasterRoutes.js` line 3: `import { verifyToken } from "../middleware/authMiddleware.js";`
- `helpRequestRoutes.js` line 3: `import { verifyToken } from "../middleware/authMiddleware.js";`

**Actual file:** `src/middleware/auth.js` exports `requireAuth`

**Solution:** Either:
1. Rename `auth.js` to `authMiddleware.js` and export `verifyToken`, OR
2. Update routes to import from `auth.js` and use `requireAuth`

## 📝 Recommended Actions

### Step 1: Fix the middleware issue first (CRITICAL)
```bash
# Option A: Rename the file
mv src/middleware/auth.js src/middleware/authMiddleware.js
# Then update auth.js to export verifyToken instead of requireAuth

# Option B: Update the route imports (easier)
# Change imports in disasterRoutes.js and helpRequestRoutes.js
```

### Step 2: Remove unnecessary files
```bash
# Remove mock database
rm src/mockDatabase.js

# Remove redundant docs
rm START_HERE.md
rm QUICK_REFERENCE.md
rm MODELS_SUMMARY.md
rm FIRESTORE_EXAMPLES.md
rm DEPLOYMENT.md

# Remove unused server files (if using server.js for local dev)
rm index.js
rm -r api/
```

### Step 3: Update .gitignore if needed
Make sure these are ignored:
- node_modules/
- .env
- *.json (Firebase credentials)

## ⚠️ Warning

Before removing `index.js` and `api/index.js`, confirm:
- Are you deploying to Vercel? Keep `api/index.js` and update it
- Are you deploying to Firebase Functions? Keep `index.js` and update it
- Using local server only? Can remove both

## 🎯 Final Structure

After cleanup:
```
API-BACK/
├── src/
│   ├── controllers/
│   ├── middleware/
│   │   └── authMiddleware.js (renamed from auth.js)
│   ├── models/
│   └── routes/
├── server.js (local development)
├── package.json
├── README.md
├── API_DOCUMENTATION.md
├── FIRESTORE_MODELS_GUIDE.md
└── VERCEL_DEPLOY.md (if deploying to Vercel)
```
