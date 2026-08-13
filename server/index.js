import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./lib/db.js";
import authRoutes from "./routers/auth.js";
import eventRoutes from "./routers/event.js";
import clubRoutes from "./routers/club.js";
import adminRoutes from "./routers/admin.js";


import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://clubviews.vercel.app",
        "https://clubtalk.vercel.app",
      ];
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        /\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);


app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Connect Database on server start
connectDB().catch((err) => {
  console.error("MongoDB connection error on startup:", err.message);
});

// Middleware to ensure DB connection on API requests
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection error on API request:", err.message);
    return res.status(500).json({
      message: "Database connection failed. Please verify MONGODB_URI in Render Environment Variables and ensure MongoDB Atlas IP Whitelist allows 0.0.0.0/0.",
      error: err.message,
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/admin", adminRoutes);


// Test Route
app.get("/", (req, res) => {
  res.send("ClubView API is Running ");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});