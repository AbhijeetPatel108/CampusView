import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {}

dotenv.config({ path: path.join(__dirname, "../server/.env") });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI, { dbName: "clubview" });
  console.log("Connected to MongoDB");

  const users = await mongoose.connection.db.collection("users").find({}).toArray();
  console.log("Registered Users Count:", users.length);
  users.forEach((u) => {
    console.log(`- Email: ${u.email} | Role: ${u.role} | Name: ${u.name || u.fullName}`);
  });

  const admins = await mongoose.connection.db.collection("admins").find({}).toArray();
  console.log("\nRegistered Admins Count:", admins.length);
  admins.forEach((a) => {
    console.log(`- Email: ${a.email} | Role: ${a.role} | Name: ${a.name}`);
  });

  process.exit(0);
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
