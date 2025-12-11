// api/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// --- IMPORT ROUTES (Note the ./src path) ---
import authRoutes from "./src/routes/auth.js";
import disasterRoutes from "./src/routes/disasterRoutes.js";
import helpRequestRoutes from "./src/routes/helpRequestRoutes.js";
import citizenRoutes from "./src/routes/citizenRoutes.js";
import organizationRoutes from "./src/routes/organizationRoutes.js";
import volunteerRoutes from "./src/routes/volunteerRoutes.js";

// Initialize Firebase Admin
import "./src/firebaseAdmin.js";

dotenv.config();
const app = express();

// --- CORS CONFIGURATION ---
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://disasterconnect.vercel.app",
    "https://disaster-conenct.vercel.app"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight checks
app.use(express.json());

// --- ROOT ENDPOINT ---
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// --- REGISTER API ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/help-requests", helpRequestRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/volunteer", volunteerRoutes);

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: "Internal server error", 
    message: err.message 
  });
});

// ================= VERCEL DEPLOYMENT CONFIG =================

// 1. Export the app for Vercel (THIS IS REQUIRED)
export default app;

// 2. Only run app.listen() if we are NOT in production (Local Development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}`);
    
    console.log(`\n--- Active Endpoints ---`);
    console.log(`🔐 Auth:          /api/auth`);
    console.log(`🌪️  Disasters:     /api/disasters`);
    console.log(`👤 Citizen:       /api/citizen`);
    console.log(`🏢 Organization:  /api/organization`);
    console.log(`🙋 Volunteer:     /api/volunteer`);
  });
}