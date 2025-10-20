import { onRequest } from "firebase-functions/https";
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.js";
import "./src/firebaseAdmin.js";

const app = express();

// Configure CORS for production
app.use(cors({
  origin: true, // Allow all origins in development, configure for production
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running on Firebase Functions!" });
});

app.use("/api/auth", authRoutes);

// Export the Express app as a Firebase Function
export const api = onRequest({ 
  region: "us-central1",
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "256MiB"
}, app);
