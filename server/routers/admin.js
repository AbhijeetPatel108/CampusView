import express from "express";
import {
  getDashboardStats,
  getClubsList,
  createClub,
  updateClub,
  getCoordinators,
  createCoordinator,
  updateCoordinator,
  getEventDataExport,
  getManualPayments,
  getUserInfo,
  completePayout,
} from "../controllers/admin.js";

const router = express.Router();

// Dashboard
router.get("/dashboard-stats", getDashboardStats);

// Clubs management
router.get("/clubs-list", getClubsList);
router.post("/clubs", createClub);
router.put("/clubs/:id", updateClub);

// Coordinators management
router.get("/coordinators", getCoordinators);
router.post("/coordinators", createCoordinator);
router.put("/coordinators/:id", updateCoordinator);

// Event data export
router.get("/event-data-export", getEventDataExport);

// Payments
router.get("/manual-payments", getManualPayments);

// Payout
router.get("/user-info/:id", getUserInfo);
router.post("/complete-payout/:eventId", completePayout);

export default router;
