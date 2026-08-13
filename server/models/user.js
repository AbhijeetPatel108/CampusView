import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    rollNo: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
    },
    year: {
      type: String,
      default: "",
    },
    program: {
      type: String,
      default: "BTECH",
    },
    role: {
      type: String,
      default: "student",
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);