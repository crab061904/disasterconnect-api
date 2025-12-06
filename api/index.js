import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import Routes
import authRoutes from "../src/routes/auth.js";
import disasterRoutes from "../src/routes/disasterRoutes.js";
import helpRequestRoutes from "../src/routes/helpRequestRoutes.js";
// !!! ADD THESE TWO MISSING ROUTES !!!
import organizationRoutes from "../src/routes/organizationRoutes.js";
import volunteerRoutes from "../src/routes/volunteerRoutes.js";

import "../src/firebaseAdmin.js";

dotenv.config();

const app = express();

// --- CORS CONFIGURATION ---
app.use(cors({
  origin: [
    "http://localhost:5173",                 // Local Development
    "http://localhost:3000",                 // Alternative Local Port
    "https://disasterconnect.vercel.app",    // Main Deployment
    "https://disaster-conenct.vercel.app"    // Secondary/Preview Deployment
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "DisasterConnect API is running!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      disasters: "/api/disasters",
      helpRequests: "/api/help-requests",
      organization: "/api/organization", // Added to documentation
      volunteer: "/api/volunteer"        // Added to documentation
    }
  });
});

// --- REGISTER API ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/help-requests", helpRequestRoutes);

// !!! REGISTER THE NEW ROUTES !!!
app.use("/api/organization", organizationRoutes);
app.use("/api/volunteer", volunteerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: "Endpoint not found",
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false,
    error: "Internal server error",
    message: err.message 
  });
});

// Export for Vercel serverless
export default app;