import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import dns from "dns";
import User from "./models/user.js";

import connectDB from "./lib/db.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {}

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const createAdmin = async () => {
  const email = process.argv[2] || "admin@mnnit.ac.in";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Super Admin";

  try {
    await connectDB();
    console.log("Connected to MongoDB Atlas successfully");

    let user = await User.findOne({ email: email.toLowerCase() });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      user.role = "admin";
      user.password = hashedPassword;
      await user.save();
      console.log(`Updated existing user (${email}) to role 'admin'!`);
    } else {
      user = await User.create({
        fullName: name,
        name: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "admin",
      });
      console.log(`Created new Admin user (${email})!`);
    }

    console.log("\n====================================");
    console.log(" ADMIN ACCOUNT READY");
    console.log(` Email:    ${email}`);
    console.log(` Password: ${password}`);
    console.log(" Login URL: /admin-secret-login");
    console.log("====================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
