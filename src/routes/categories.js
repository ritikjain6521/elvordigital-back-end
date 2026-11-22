const express = require("express");
const Category = require("../models/Category");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    console.error("[Categories] Fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch categories." });
  }
});

// @route   POST /api/categories
// @desc    Add new category (Point 7)
// @access  Private (Admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon, gradient } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required." });
    }

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const existing = await Category.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: "A category with this slug already exists." });
    }

    const category = new Category({
      name,
      slug: generatedSlug,
      description: description || "",
      icon: icon || "Folder",
      gradient: gradient || "from-purple-500/20 to-indigo-500/10",
      productCount: 0,
    });

    const saved = await category.save();
    return res.status(201).json({ success: true, message: "Category created successfully.", category: saved });
  } catch (error) {
    console.error("[Categories] Create error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create category." });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    return res.json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    console.error("[Categories] Delete error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete category." });
  }
});

module.exports = router;
