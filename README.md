# DisasterConnect API

Backend API deployed on Vercel (serverless functions).

## 🚀 Quick Deploy

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/disasterconnect-api.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to https://vercel.com/dashboard
2. Import your GitHub repo
3. Add environment variable:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** (Copy content of `dissasterconnect-firebase-adminsdk-*.json`)
4. Deploy!

### 3. Update Frontend
Use your Vercel backend URL in the frontend:
```
https://your-api-name.vercel.app
```

See **VERCEL_DEPLOY.md** for detailed instructions.

---

## 🛠️ Local Development

```bash
npm install
npm run dev
```

Runs on http://localhost:5000

---

## 📡 API Endpoints

- `GET /` - Health check
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

---

## 🔐 Environment Variables

Required:
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase Admin SDK credentials

---

## 📚 Documentation

- **VERCEL_DEPLOY.md** - Complete deployment guide
- **DEPLOYMENT.md** - Alternative deployment options
