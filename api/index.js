import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "../src/routes/auth.js";
import disasterRoutes from "../src/routes/disasterRoutes.js";
import helpRequestRoutes from "../src/routes/helpRequestRoutes.js";
import "../src/firebaseAdmin.js";

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
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
      helpRequests: "/api/help-requests"
    }
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/help-requests", helpRequestRoutes);

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
