import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";
import disasterRoutes from "./src/routes/disasterRoutes.js";
import helpRequestRoutes from "./src/routes/helpRequestRoutes.js";
import organizationRoutes from "./src/routes/organizationRoutes.js"; // Add this line
import "./src/firebaseAdmin.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/help-requests", helpRequestRoutes);
app.use("/api/organizations", organizationRoutes); // Add this line

const PORT = process.env.PORT || 5000;

// Add error handling and keep-alive
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoints: /api/auth/register, /api/auth/login`);
  console.log(`🌪️  Disaster endpoints: /api/disasters`);
  console.log(`🆘 Help Request endpoints: /api/help-requests`);
  console.log(`🏢 Organization endpoints: /api/organizations`); // Add this line
  console.log(`Press Ctrl+C to stop the server`);
});

// Handle server errors
server.on("error", (error) => {
  console.error("❌ Server error:", error);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

// Keep the process alive
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
