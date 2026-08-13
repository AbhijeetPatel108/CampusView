import bcrypt from "bcrypt";
import User from "../models/user.js";
import generateToken from "../utils/generateToken.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  if (!userObj.name && userObj.fullName) {
    userObj.name = userObj.fullName;
  }
  return userObj;
};

export const register = async (req, res) => {
  try {
    const { name, fullName, email, password, rollNo, branch, year, program } = req.body;
    const userName = name || fullName;

    if (!userName || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName: userName,
      name: userName,
      email: email.toLowerCase(),
      password: hashedPassword,
      rollNo: rollNo || "",
      branch: branch || "",
      year: year || "",
      program: program || "BTECH",
      role: "student",
    });

    const role = newUser.role || "student";
    const token = generateToken(newUser._id, role);
    const userObj = sanitizeUser(newUser);

    res.cookie("jwt", token, cookieOptions);
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: userObj,
      role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const role = user.role || "student";
    const token = generateToken(user._id, role);
    const userObj = sanitizeUser(user);

    res.cookie("jwt", token, cookieOptions);
    res.cookie("token", token, cookieOptions);

    res.json({
      success: true,
      message: "Login successful",
      user: userObj,
      role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Login failed" });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const role = user.role || "student";
    const token = generateToken(user._id, role);
    const userObj = sanitizeUser(user);

    res.cookie("jwt", token, cookieOptions);
    res.cookie("token", token, cookieOptions);

    return res.json({
      success: true,
      message: "Verification successful",
      user: userObj,
      role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "OTP verification failed" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt");
  res.clearCookie("token");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getMe = async (req, res) => {
  try {
    const userObj = sanitizeUser(req.user);
    res.json({
      success: true,
      user: userObj,
      role: req.user.role || "student",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.params.id;
    const updateData = { ...req.body };
    delete updateData.password;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userObj = sanitizeUser(updatedUser);
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};