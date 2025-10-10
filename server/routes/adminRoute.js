import express from "express";
import { authenticateAdmin } from "../middleware/auth.js";
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllReportsAdmin,
  getAllBinsAdmin,
  bulkUpdateReports,
  getAnalytics
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication
router.use(authenticateAdmin);

// Dashboard routes
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/analytics", getAnalytics);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Report management routes
router.get("/reports", getAllReportsAdmin);
router.put("/reports/bulk-update", bulkUpdateReports);

// Bin management routes
router.get("/bins", getAllBinsAdmin);

export default router;
