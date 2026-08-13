import jwt from "jsonwebtoken";
import User from "../models/user.js";

const JWT_SECRET = process.env.JWT_SECRET || "yourSuperSecretKey";

const getTokensFromRequest = (req) => {
  const tokens = [];
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    tokens.push(authHeader.slice(7));
  } else if (authHeader) {
    tokens.push(authHeader);
  }
  if (req.cookies?.jwt && !tokens.includes(req.cookies.jwt)) {
    tokens.push(req.cookies.jwt);
  }
  if (req.cookies?.token && !tokens.includes(req.cookies.token)) {
    tokens.push(req.cookies.token);
  }
  return tokens;
};

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  const tokens = getTokensFromRequest(req);

  if (tokens.length === 0) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    let decoded = null;
    for (const token of tokens) {
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        break;
      } catch {
        // Try next token transport
      }
    }

    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Role-based access control middleware
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};