import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Existing Routes
import authRoutes from "./src/routes/auth.js";
import disasterRoutes from "./src/routes/disasterRoutes.js";
import helpRequestRoutes from "./src/routes/helpRequestRoutes.js";

// NEW: Organization and Volunteer Routes
import organizationRoutes from "./src/routes/organizationRoutes.js";
import volunteerRoutes from "./src/routes/volunteerRoutes.js";

import "./src/firebaseAdmin.js";

dotenv.config();
const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",                 // For local development
    "http://localhost:3000",                 // Alternative local port
    "https://disasterconnect.vercel.app"     // <--- YOUR NEW DEPLOYED FRONTEND URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// ================= API Routes =================
app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/help-requests", helpRequestRoutes);

// Register the new routes
app.use("/api/organization", organizationRoutes); // Handles centers, announcements, resources, reports
app.use("/api/volunteer", volunteerRoutes);       // Handles availability, assignments, missions

const PORT = process.env.PORT || 5000;

// Add error handling and keep-alive
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}`);
  
  console.log(`\n--- Active Endpoints ---`);
  console.log(`🔐 Auth:          /api/auth`);
  console.log(`🌪️  Disasters:     /api/disasters`);
  console.log(`🆘 Help Requests: /api/help-requests`);
  console.log(`🏢 Organization:  /api/organization (Centers, Announcements, Resources)`);
  console.log(`🙋 Volunteer:     /api/volunteer (Availability, Assignments)`);
  
  console.log(`\nPress Ctrl+C to stop the server`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});