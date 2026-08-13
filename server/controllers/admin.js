import Club from "../models/club.js";
import Event from "../models/event.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const makeUniqueSlug = async (base) => {
  let slug = slugify(base);
  let counter = 1;
  while (await Club.findOne({ slug })) {
    slug = `${slugify(base)}-${counter}`;
    counter++;
  }
  return slug;
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS   GET /api/admin/dashboard-stats
// ─────────────────────────────────────────────────────────────────────────────

export const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalEvents, totalClubs, activeEvents] =
      await Promise.all([
        User.countDocuments({ role: "student" }),
        Event.countDocuments(),
        Club.countDocuments({ isActive: true }),
        Event.countDocuments({ status: "LIVE" }),
      ]);

    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title slug status startTime club registeredCount");

    res.json({
      totalStudents,
      totalEvents,
      totalClubs,
      activeEvents,
      recentEvents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CLUBS LIST   GET /api/admin/clubs-list
// ─────────────────────────────────────────────────────────────────────────────

export const getClubsList = async (req, res) => {
  try {
    const clubs = await Club.find().sort({ clubName: 1 });
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE CLUB   POST /api/admin/clubs
// ─────────────────────────────────────────────────────────────────────────────

export const createClub = async (req, res) => {
  try {
    const {
      clubName,
      slug: providedSlug,
      category,
      description,
      clubLogo,
      facultyName,
      facultyEmail,
      clubEmail,
      facultyCoordinators,
      studentCoordinators,
      socialLinks,
    } = req.body;

    if (!clubName) {
      return res.status(400).json({ message: "Club name is required." });
    }

    const slug = providedSlug
      ? await makeUniqueSlug(providedSlug)
      : await makeUniqueSlug(clubName);

    // Parse JSON strings if sent from FormData
    const parseSafe = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return [];
    };

    let parsedFaculty = parseSafe(facultyCoordinators);
    if (parsedFaculty.length === 0 && (facultyName || facultyEmail)) {
      parsedFaculty = [{ name: facultyName || "", email: facultyEmail || "" }];
    }

    const club = await Club.create({
      clubName,
      slug,
      category: category || "Student Club",
      description: description || "",
      clubLogo: clubLogo || "",
      facultyName: facultyName || "",
      facultyEmail: facultyEmail || "",
      clubEmail: clubEmail || "",
      facultyCoordinators: parsedFaculty,
      studentCoordinators: parseSafe(studentCoordinators),
      socialLinks: parseSafe(socialLinks),
    });

    res.status(201).json({ success: true, club });
  } catch (error) {
    if (error.code === 11000 && error.keyValue?.slug) {
      return res.status(400).json({ message: "Club slug already exists." });
    }
    res.status(500).json({ message: error.message || "Failed to create club" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE CLUB   PUT /api/admin/clubs/:id
// ─────────────────────────────────────────────────────────────────────────────

export const updateClub = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      clubName,
      category,
      description,
      clubLogo,
      facultyName,
      facultyEmail,
      clubEmail,
      facultyCoordinators,
      studentCoordinators,
      socialLinks,
      isActive,
    } = req.body;

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const parseSafe = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    if (clubName !== undefined) club.clubName = clubName;
    if (category !== undefined) club.category = category;
    if (description !== undefined) club.description = description;
    if (clubLogo !== undefined) club.clubLogo = clubLogo;
    if (facultyName !== undefined) club.facultyName = facultyName;
    if (facultyEmail !== undefined) club.facultyEmail = facultyEmail;
    if (clubEmail !== undefined) club.clubEmail = clubEmail;
    if (isActive !== undefined) club.isActive = Boolean(isActive);

    const fc = parseSafe(facultyCoordinators);
    if (fc !== undefined) club.facultyCoordinators = fc;

    const sc = parseSafe(studentCoordinators);
    if (sc !== undefined) club.studentCoordinators = sc;

    const sl = parseSafe(socialLinks);
    if (sl !== undefined) club.socialLinks = sl;

    await club.save();
    res.json({ success: true, club });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update club" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COORDINATORS   GET /api/admin/coordinators
// ─────────────────────────────────────────────────────────────────────────────

export const getCoordinators = async (req, res) => {
  try {
    const coordinators = await User.find({ role: "coordinator" })
      .select("-password")
      .sort({ fullName: 1 });
    res.json(coordinators);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE COORDINATOR   POST /api/admin/coordinators
// ─────────────────────────────────────────────────────────────────────────────

export const createCoordinator = async (req, res) => {
  try {
    const { name, fullName, email, password, branch } = req.body;
    const userName = name || fullName;

    if (!userName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const coordinator = await User.create({
      fullName: userName,
      name: userName,
      email: email.toLowerCase(),
      password: hashedPassword,
      branch: branch || "",
      role: "coordinator",
    });

    const userObj = coordinator.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, coordinator: userObj });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Failed to create coordinator" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE COORDINATOR   PUT /api/admin/coordinators/:id
// ─────────────────────────────────────────────────────────────────────────────

export const updateCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fullName, branch } = req.body;

    const user = await User.findById(id);
    if (!user || user.role !== "coordinator") {
      return res.status(404).json({ message: "Coordinator not found" });
    }

    if (name || fullName) {
      const n = name || fullName;
      user.name = n;
      user.fullName = n;
    }
    if (branch !== undefined) user.branch = branch;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ success: true, coordinator: userObj });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Failed to update coordinator" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EVENT DATA EXPORT   GET /api/admin/event-data-export
// Query params: month, year, clubId
// ─────────────────────────────────────────────────────────────────────────────

export const getEventDataExport = async (req, res) => {
  try {
    const { month, year, clubId } = req.query;

    const filter = {};

    if (clubId && clubId !== "all") {
      filter["club.clubId"] = clubId;
    }

    const allEvents = await Event.find(filter).sort({ startTime: -1 });

    // Apply month/year filters in JS (startTime is a Date)
    const filtered = allEvents.filter((e) => {
      const d = new Date(e.startTime);
      if (month && month !== "all" && d.getMonth() + 1 !== Number(month))
        return false;
      if (year && year !== "all" && d.getFullYear() !== Number(year))
        return false;
      return true;
    });

    const events = filtered.map((e) => ({
      _id: e._id,
      eventName: e.title,
      clubName: e.club?.clubName || "",
      clubId: e.club?.clubId || "",
      totalRegistrations: e.registeredCount || 0,
      eventType: e.entryFee > 0 ? "Paid" : "Free",
      eventDate: e.startTime,
      totalAmountReceived: (e.registeredCount || 0) * (e.entryFee || 0),
      status: e.status,
    }));

    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL PAYMENTS (stub)   GET /api/admin/manual-payments
// ─────────────────────────────────────────────────────────────────────────────

export const getManualPayments = async (req, res) => {
  try {
    // Stub — returns shape the client expects
    res.json({ participations: [], summary: null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER INFO   GET /api/admin/user-info/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getUserInfo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE PAYOUT (stub)   POST /api/admin/complete-payout/:eventId
// ─────────────────────────────────────────────────────────────────────────────

export const completePayout = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Stub — mark as payout complete (no payment model yet)
    res.json({ success: true, message: "Payout marked as complete" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
