import mongoose from "mongoose";
import dns from "dns";

// Try setting DNS servers for environments with SRV query issues (Windows/local ISPs)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("Could not set custom DNS servers:", err.message);
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb+srv://choudharyaashish613_db_user:Tanu19092006@cluster0.zyxrpkb.mongodb.net/?appName=Cluster0";

  if (!MONGODB_URI) {
    console.error("❌ CRITICAL ERROR: MONGODB_URI environment variable is missing!");
    throw new Error("Please define the MONGODB_URI environment variable in Render environment settings.");
  }


  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise || mongoose.connection.readyState === 0) {
    console.log("Connecting to MongoDB Atlas...");
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "clubview",
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB Connected Successfully");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

export default connectDB;