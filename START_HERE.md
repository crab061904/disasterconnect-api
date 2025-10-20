# 🚀 START HERE - Deploy to Vercel (FREE)

## What I've Set Up For You

✅ **Vercel serverless function** in `api/index.js`
✅ **Vercel configuration** in `vercel.json`
✅ **Package.json** updated with deploy script
✅ **Documentation** ready

---

## Deploy in 3 Commands

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Backend ready"
# Create repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/disasterconnect-api.git
git push -u origin main

# 2. Deploy to Vercel (via dashboard)
# Go to vercel.com/dashboard
# Import your repo
# Add FIREBASE_SERVICE_ACCOUNT_JSON env var
# Deploy!

# 3. Done! Copy your URL
```

---

## Environment Variable Setup

In Vercel dashboard, add:

**Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`

**Value:** Copy the entire content of:
`dissasterconnect-firebase-adminsdk-fbsvc-36d786c346.json`

To get it as one line (PowerShell):
```powershell
Get-Content dissasterconnect-firebase-adminsdk-fbsvc-36d786c346.json -Raw | ForEach-Object { $_ -replace '\s+', ' ' }
```

---

## After Deployment

1. Copy your backend URL (e.g., `https://disasterconnect-api.vercel.app`)
2. Update frontend `src/lib/api.ts` with this URL
3. Deploy frontend to Vercel
4. Test your app!

---

## 📚 Full Documentation

- **VERCEL_DEPLOY.md** - Complete deployment guide
- **README.md** - Quick reference

---

## 🆘 Quick Test

After deployment, test:
```bash
curl https://YOUR-URL.vercel.app/
```

Should return:
```json
{"message":"Backend is running on Vercel!"}
```

---

## Local Development

```bash
npm run dev
```

Runs on http://localhost:5000

---

**Ready? Go to vercel.com/dashboard and import your repo!** 🚀
