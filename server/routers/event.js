import express from "express";
import {
  getAllEvents,
  getEventBySlug,
  getEventsForUser,
  registerForEvent,
  createEvent,
  deleteEvent,
} from "../controllers/event.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", createEvent);
router.get("/:slug", getEventBySlug);
router.get("/user/:userId", getEventsForUser);
router.post("/:eventId/register", registerForEvent);
router.delete("/:id", deleteEvent);

export default router;