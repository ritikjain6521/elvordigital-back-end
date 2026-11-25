const express = require("express");
const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "ElvorDigital_super_secret_jwt_key_2026_futurecept", {
    expiresIn: "30d",
  });
};

// @route   POST /api/auth/login
// @desc    Admin login with user id / email and password
// @access  Public
router.post("/login", async (req, res) => {
  const identifier = req.body.identifier || req.body.username || req.body.usernameOrEmail || req.body.email;
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: "Please provide both User ID / Email and Password." });
  }

  try {
    // Find by email or username
    const user = await AdminUser.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.trim() },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid User ID or Password." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "This administrative account has been deactivated." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid User ID or Password." });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: "Admin authentication successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during authentication." });
  }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated admin user
// @access  Private (Admin)
router.get("/me", protectAdmin, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      avatar: req.user.avatar,
    },
  });
});

module.exports = router;
