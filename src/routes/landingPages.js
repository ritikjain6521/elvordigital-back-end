const express = require("express");
const LandingPage = require("../models/LandingPage");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/landing-pages
// @desc    Get all landing pages
router.get("/", async (req, res) => {
  try {
    const landingPages = await LandingPage.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: landingPages.length, landingPages });
  } catch (error) {
    console.error("[LandingPages] Fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve landing pages." });
  }
});

// @route   GET /api/landing-pages/:idOrSlug
// @desc    Get single landing page by ID or Slug
router.get("/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let landingPage = null;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      landingPage = await LandingPage.findById(idOrSlug);
    }

    if (!landingPage) {
      landingPage = await LandingPage.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!landingPage) {
      return res.status(404).json({ success: false, message: "Landing page not found." });
    }

    return res.json({ success: true, landingPage });
  } catch (error) {
    console.error("[LandingPages] Single fetch error:", error);
    return res.status(500).json({ success: false, message: "Error retrieving landing page." });
  }
});

// @route   POST /api/landing-pages
// @desc    Create a new landing page
// @access  Private (Admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { productId, productSlug, productName, title, slug, status, sections } = req.body;

    if (!productId || !title || !slug) {
      return res.status(400).json({
        success: false,
        message: "Product ID, title, and slug are required.",
      });
    }

    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    let finalSlug = cleanSlug || `lp-${Date.now()}`;
    const existing = await LandingPage.findOne({ slug: finalSlug });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newLp = new LandingPage({
      productId,
      productSlug: productSlug || finalSlug,
      productName: productName || title,
      title,
      slug: finalSlug,
      status: status || "published",
      sections: Array.isArray(sections) ? sections : [],
    });

    const saved = await newLp.save();
    return res.status(201).json({ success: true, landingPage: saved });
  } catch (error) {
    console.error("[LandingPages] Create error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create landing page." });
  }
});

// @route   PUT /api/landing-pages/:id
// @desc    Update landing page
// @access  Private (Admin)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const landingPage = await LandingPage.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!landingPage) {
      return res.status(404).json({ success: false, message: "Landing page not found." });
    }

    return res.json({ success: true, landingPage });
  } catch (error) {
    console.error("[LandingPages] Update error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update landing page." });
  }
});

// @route   DELETE /api/landing-pages/:id
// @desc    Delete landing page
// @access  Private (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LandingPage.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Landing page not found." });
    }

    return res.json({ success: true, message: "Landing page deleted successfully." });
  } catch (error) {
    console.error("[LandingPages] Delete error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete landing page." });
  }
});

module.exports = router;
