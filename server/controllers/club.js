import Club from "../models/club.js";
import Event from "../models/event.js";
import mongoose from "mongoose";

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

// GET /api/clubs
export const getAllClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ isActive: true }).sort({ clubName: 1 });
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/clubs/:slug   (accepts slug string OR ObjectId)
export const getClubBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    let club = null;

    if (mongoose.Types.ObjectId.isValid(slug)) {
      club = await Club.findById(slug);
    }

    if (!club) {
      club = await Club.findOne({ slug });
    }

    // Smart fallback matching for typos or slight variations in slug
    if (!club && slug) {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
      const allClubs = await Club.find();
      club = allClubs.find((c) => {
        const cSlugClean = (c.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const cNameClean = (c.clubName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          cSlugClean === cleanSlug ||
          cNameClean === cleanSlug ||
          cSlugClean.startsWith(cleanSlug) ||
          cleanSlug.startsWith(cSlugClean)
        );
      });
    }

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Return club's events alongside club data
    const events = await Event.find({ "club.clubId": String(club._id) }).sort({
      startTime: 1,
    });

    res.json({ club, events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/clubs/:id
export const deleteClub = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Club.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Club not found" });
    }
    res.json({ success: true, message: "Club deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
