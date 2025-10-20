import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", requireAuth, authController.getProfile);

export default router;
