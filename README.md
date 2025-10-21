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

### Quick Reference

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (auth required)

**Disasters:**
- `GET /api/disasters/active` - Get active disasters
- `GET /api/disasters/nearby` - Get nearby disasters
- `GET /api/disasters/:id` - Get disaster by ID
- `POST /api/disasters` - Create disaster report (auth required)
- `PUT /api/disasters/:id` - Update disaster (auth required)
- `DELETE /api/disasters/:id` - Delete disaster (auth required)

**Help Requests:**
- `GET /api/help-requests/pending` - Get pending help requests
- `GET /api/help-requests/disaster/:disasterId` - Get requests by disaster
- `GET /api/help-requests/:id` - Get help request by ID
- `POST /api/help-requests` - Create help request (auth required)
- `PATCH /api/help-requests/:id/assign` - Assign request (auth required)
- `PATCH /api/help-requests/:id/fulfill` - Mark as fulfilled (auth required)

📖 **[View Complete API Documentation](./API_DOCUMENTATION.md)** - Detailed documentation with request/response examples

---

## 🔐 Environment Variables

Required:
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase Admin SDK credentials
- `JWT_SECRET` - Secret key for JWT token generation (optional, defaults to "change-me")
- `JWT_EXPIRES_IN` - JWT token expiration time (optional, defaults to "7d")

---

## 📚 Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with all endpoints
- **VERCEL_DEPLOY.md** - Complete deployment guide
- **DEPLOYMENT.md** - Alternative deployment options
