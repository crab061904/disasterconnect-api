import express from "express";
import cors from "cors";
import authRoutes from "../src/routes/auth.js";
import "../src/firebaseAdmin.js";

const app = express();

// Configure CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Backend is running on Vercel!" });
});

app.get("/api", (req, res) => {
  res.json({ message: "Backend is running on Vercel!" });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Export for Vercel serverless
export default app;
