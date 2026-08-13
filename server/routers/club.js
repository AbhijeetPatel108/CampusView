import express from "express";
import {
  getAllClubs,
  getClubBySlug,
  deleteClub,
} from "../controllers/club.js";

const router = express.Router();

router.get("/", getAllClubs);
router.get("/:slug", getClubBySlug);
router.delete("/:id", deleteClub);

export default router;
