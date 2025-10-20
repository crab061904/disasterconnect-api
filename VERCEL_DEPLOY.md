# Deploy Backend to Vercel (100% FREE)

## Why Vercel for Backend?
- ✅ Completely free
- ✅ Same platform as your frontend
- ✅ Serverless functions (auto-scaling)
- ✅ Built-in SSL
- ✅ No sleep/cold starts like Render

---

## Quick Deploy (3 Steps)

### Step 1: Push to GitHub (if not already)

```bash
cd API

# Initialize git if needed
git init
git add .
git commit -m "Backend ready for Vercel"

# Create repo at https://github.com/new then:
git remote add origin https://github.com/YOUR_USERNAME/disasterconnect-api.git
git push -u origin main
```

### Step 2: Deploy on Vercel

#### Option A: Via Dashboard (Easiest)
1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `disasterconnect-api`
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** Leave empty or `npm install`
   - **Output Directory:** Leave empty
5. Add Environment Variables (click "Environment Variables"):
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** Copy entire content of `dissasterconnect-firebase-adminsdk-*.json` as one line
   
   To get one-line JSON:
   ```bash
   # Windows PowerShell
   Get-Content dissasterconnect-firebase-adminsdk-fbsvc-36d786c346.json -Raw | ForEach-Object { $_ -replace '\s+', ' ' }
   ```

6. Click **"Deploy"**

#### Option B: Via CLI
```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

### Step 3: Set Environment Variable via CLI (if using Option B)
```bash
# Add Firebase service account
vercel env add FIREBASE_SERVICE_ACCOUNT_JSON

# Paste the JSON content (one line), select Production
```

---

## Your Backend URL

After deployment, your backend will be at:
```
https://disasterconnect-api.vercel.app
```

Or with custom domain:
```
https://your-custom-domain.vercel.app
```

### API Endpoints:
- Base: `https://disasterconnect-api.vercel.app/`
- Register: `https://disasterconnect-api.vercel.app/api/auth/register`
- Login: `https://disasterconnect-api.vercel.app/api/auth/login`

---

## Update Frontend

### Option 1: Update Frontend Code
Edit `src/lib/api.ts`:
```typescript
const API_BASE_URL = 'https://disasterconnect-api.vercel.app';
```

### Option 2: Use Environment Variable (Better)
1. In your **frontend** Vercel project settings
2. Add environment variable:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://disasterconnect-api.vercel.app`
3. Update `src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```
4. Redeploy frontend

---

## Test Your Deployment

```bash
# Test base endpoint
curl https://disasterconnect-api.vercel.app/

# Expected: {"message":"Backend is running on Vercel!"}

# Test auth endpoint
curl -X POST https://disasterconnect-api.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User","role":"user"}'
```

---

## Local Development

Continue using:
```bash
npm run dev
```

This runs on `http://localhost:5000` using `server.js`

---

## Important Notes

### Firebase Service Account Security
**Never commit** `dissasterconnect-firebase-adminsdk-*.json` to GitHub!

The file is already in `.gitignore`. Always use environment variables in Vercel.

### Environment Variables in Vercel
To update environment variables:
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Edit variables
3. Redeploy (Vercel will prompt you)

### CORS Configuration
The backend is configured with `origin: true` to accept all origins. For production, you may want to restrict this:

Edit `api/index.js`:
```javascript
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

---

## Troubleshooting

### "Module not found" errors
- Ensure all imports use correct relative paths
- Check that all dependencies are in `package.json`

### Firebase Admin errors
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Vercel
- Check it's valid JSON (use JSON validator)
- Ensure no line breaks in the environment variable

### Function timeout
- Vercel free tier has 10s timeout for serverless functions
- This should be enough for most operations
- If needed, upgrade to Pro for 60s timeout

### Cold starts
- First request may be slower (~1-2s)
- Subsequent requests are fast
- This is normal for serverless functions

---

## View Logs

### Via Dashboard
1. Vercel Dashboard → Your Project
2. Click on a deployment
3. View "Functions" tab for logs

### Via CLI
```bash
vercel logs
```

---

## Comparison: Vercel vs Others

| Feature | Vercel | Render | Railway |
|---------|--------|--------|---------|
| **Cost** | Free | Free | $5/month credit |
| **Cold Starts** | ~1-2s | ~30s after sleep | Minimal |
| **Always On** | ✅ | ❌ (sleeps) | ✅ |
| **Timeout** | 10s (free) | 60s | 60s |
| **Setup** | Easiest | Easy | Easy |

**Recommendation:** Vercel is perfect for your use case - same platform as frontend, no sleep issues, completely free!

---

## Next Steps

1. ✅ Deploy backend to Vercel
2. ✅ Update frontend API URL
3. 🔒 Restrict CORS to your frontend domain
4. 📊 Monitor usage in Vercel dashboard
5. 🚀 Optional: Set up custom domain

Done! Your full-stack app is now deployed for FREE! 🎉
