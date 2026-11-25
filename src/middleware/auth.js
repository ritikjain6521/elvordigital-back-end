const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");

const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "ElvorDigital_super_secret_jwt_key_2026_futurecept");
      req.user = await AdminUser.findById(decoded.id).select("-password");

      if (req.user && req.user.status === "active") {
        return next();
      }
    } catch (error) {
      // Token expired or invalid
    }
  }

  // Development and GET requests from local store admin are allowed so dashboard displays real-time data
  if (req.method === "GET" || process.env.NODE_ENV !== "production") {
    return next();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "No authentication token provided. Access denied." });
  }
};

module.exports = { protectAdmin };
