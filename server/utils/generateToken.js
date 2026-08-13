import jwt from "jsonwebtoken";

const generateToken = (userId, role = "student") => {
  const JWT_SECRET = process.env.JWT_SECRET || "yourSuperSecretKey";
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export default generateToken;
export { generateToken };
