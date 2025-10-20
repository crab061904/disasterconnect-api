# Backend Deployment Guide

## Prerequisites
1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

## Deployment Steps

### 1. Install Dependencies
```bash
cd BackEnd
npm install
```

### 2. Deploy to Firebase Functions
```bash
npm run deploy
```

This will deploy your backend to Firebase Functions. After deployment, you'll get a URL like:
```
https://us-central1-dissasterconnect.cloudfunctions.net/api
```

### 3. Test the Deployed Function
```bash
curl https://us-central1-dissasterconnect.cloudfunctions.net/api
```

You should see: `{"message":"Backend is running on Firebase Functions!"}`

## Environment Variables

Firebase Functions automatically has access to Firebase Admin SDK credentials when deployed.
No need to set FIREBASE_SERVICE_ACCOUNT_JSON in production.

If you need other environment variables, set them using:
```bash
firebase functions:config:set someservice.key="THE API KEY"
```

## API Endpoints

After deployment, your endpoints will be:
- Base: `https://us-central1-dissasterconnect.cloudfunctions.net/api`
- Auth Register: `https://us-central1-dissasterconnect.cloudfunctions.net/api/api/auth/register`
- Auth Login: `https://us-central1-dissasterconnect.cloudfunctions.net/api/api/auth/login`

## View Logs
```bash
npm run logs
```

Or in Firebase Console:
https://console.firebase.google.com/project/dissasterconnect/functions

## Local Development
For local development, continue using:
```bash
npm run dev
```

This runs the Express server directly on localhost:5000
