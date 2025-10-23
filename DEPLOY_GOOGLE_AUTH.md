# Deploy Google Authentication Update to Vercel

## Issue
The Google authentication endpoint `/api/auth/google` returns 404 because the backend changes haven't been deployed to Vercel yet.

## Solution: Redeploy Backend

### Option 1: Via Vercel Dashboard (Recommended)

1. **Push changes to GitHub:**
   ```bash
   cd API-BACK
   git add .
   git commit -m "Add Google authentication endpoint"
   git push
   ```

2. **Vercel will auto-deploy:**
   - If you have auto-deploy enabled, Vercel will automatically deploy the changes
   - Check your Vercel dashboard at https://vercel.com/dashboard
   - Wait for deployment to complete (usually 1-2 minutes)

3. **Verify deployment:**
   - Visit: https://disasterconnect-api.vercel.app/api/auth/google
   - You should see a 400 error (not 404) saying "Missing required fields: idToken"
   - This confirms the endpoint exists!

### Option 2: Via Vercel CLI

```bash
cd API-BACK

# Login to Vercel (if not already)
vercel login

# Deploy to production
vercel --prod
```

### Option 3: Manual Redeploy from Dashboard

1. Go to https://vercel.com/dashboard
2. Find your backend project: **disasterconnect-api**
3. Click on the project
4. Go to **Deployments** tab
5. Click the **three dots** on the latest deployment
6. Click **Redeploy**
7. Confirm the redeployment

## Files That Were Added/Modified

✅ **api/index.js** - Created Vercel entry point (was missing)
✅ **src/controllers/authController.js** - Added `googleLogin()` method
✅ **src/routes/auth.js** - Added `/api/auth/google` route

## After Deployment

### Test the endpoint:
```bash
# Should return 400 (missing idToken) - this is good!
curl -X POST https://disasterconnect-api.vercel.app/api/auth/google

# Should return 404 if not deployed yet
```

### Enable Google Sign-In in Firebase Console:
1. Go to https://console.firebase.google.com/
2. Select project: **dissasterconnect**
3. Navigate to **Authentication** → **Sign-in method**
4. Click **Google** provider
5. Enable it
6. Set support email
7. Click **Save**

### Add authorized domains:
1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add: `disasterconnect.vercel.app` (or your frontend domain)
3. `localhost` should already be there

## Verify Everything Works

1. **Test backend endpoint:**
   ```bash
   curl https://disasterconnect-api.vercel.app/
   ```
   Should return: `{"message": "DisasterConnect API is running!"}`

2. **Test Google auth endpoint exists:**
   ```bash
   curl -X POST https://disasterconnect-api.vercel.app/api/auth/google \
     -H "Content-Type: application/json" \
     -d '{"idToken":"test"}'
   ```
   Should return 401 error (Invalid Google token) - this means endpoint exists!

3. **Test from frontend:**
   - Go to your login page
   - Click "Sign in with Google"
   - Should open Google popup
   - After selecting account, should redirect to dashboard

## Troubleshooting

### Still getting 404?
- Check Vercel deployment logs
- Ensure `api/index.js` file exists
- Verify routes are properly imported in `api/index.js`

### Getting CORS errors?
The `api/index.js` file has CORS configured with `origin: '*'` which allows all origins.

### Firebase Admin errors?
- Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable is set in Vercel
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Verify the JSON is valid

## Quick Deploy Command

```bash
cd API-BACK
git add .
git commit -m "Add Google authentication + fix Vercel entry point"
git push
# Vercel will auto-deploy
```

Wait 1-2 minutes, then test!
