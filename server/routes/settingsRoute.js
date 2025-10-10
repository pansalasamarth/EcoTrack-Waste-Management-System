import express from "express";
import { authenticateAdmin } from "../middleware/auth.js";
import {
  getSettings,
  updateSettings,
  resetSettings
} from "../controllers/settingsController.js";

const router = express.Router();

// All settings routes require admin authentication
router.use(authenticateAdmin);

router.get("/", getSettings);
router.put("/", updateSettings);
router.post("/reset", resetSettings);

export default router;
