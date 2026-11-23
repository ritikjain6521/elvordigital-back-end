const express = require("express");
const Product = require("../models/Product");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products (public)
router.get("/", async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error("[Products] Fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve products." });
  }
});

// @route   GET /api/products/:idOrSlug
// @desc    Get single product by ID or Slug
router.get("/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    }

    if (!product) {
      product = await Product.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.json({ success: true, product });
  } catch (error) {
    console.error("[Products] Single fetch error:", error);
    return res.status(500).json({ success: false, message: "Error retrieving product." });
  }
});

// @route   POST /api/products
// @desc    Create new product with photos, Google Drive link, and section managers
// @access  Private (Admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      sku,
      category,
      categoryName,
      tagline,
      shortDescription,
      fullDescription,
      price,
      originalPrice,
      discount,
      badge,
      isFeatured,
      isBestSeller,
      isNewArrival,
      isFree,
      productFormat,
      fileSize,
      status,

      // Point 5 & 8: Photos and Deliverable Access Links
      photos,
      thumbnail,
      googleDriveLink,
      accessFolderLink,
      videoLink,
      downloadFileUrl,

      // Point 6: Product Details Sections
      deliverables,
      overviewText,
      features,
      previewVideoUrl,
      bonuses,
      faqs,

      // Point 2: Ads & Marketing Copy
      adCopy,

      // Point 2: Extended Sections
      curriculum,
      targetAudienceList,
      requirements,
      guaranteeText,
      urgencyNotice,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: "Product name and price are required." });
    }

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const existing = await Product.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: "A product with this URL slug already exists." });
    }

    const newProduct = new Product({
      name,
      slug: generatedSlug,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      category: category || "meta-ads-courses",
      categoryName: categoryName || "Meta Ads Courses",
      tagline: tagline || "",
      shortDescription: shortDescription || "",
      fullDescription: fullDescription || "",
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      discount: discount || "",
      badge: badge || "",
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      isNewArrival: Boolean(isNewArrival),
      isFree: Boolean(isFree),
      productFormat: productFormat || "Digital Video Course & Resources",
      fileSize: fileSize || "45 MB",
      status: status || "published",

      photos: Array.isArray(photos) ? photos : photos ? [photos] : [],
      thumbnail: thumbnail || (photos && photos[0]) || "",
      googleDriveLink: googleDriveLink || "",
      accessFolderLink: accessFolderLink || "",
      videoLink: videoLink || "",
      downloadFileUrl: downloadFileUrl || "",

      deliverables: deliverables || [],
      overviewText: overviewText || "",
      features: features || [],
      previewVideoUrl: previewVideoUrl || "",
      bonuses: bonuses || [],
      faqs: faqs || [],

      adCopy: adCopy || {
        headline: "",
        hook: "",
        primaryText: "",
        callToAction: "Get Instant Access",
        targetAudience: "",
        adMediaUrl: "",
      },

      curriculum: curriculum || [],
      targetAudienceList: targetAudienceList || [],
      requirements: requirements || [],
      guaranteeText: guaranteeText || "100% Satisfaction Guarantee: Instant verified access upon purchase.",
      urgencyNotice: urgencyNotice || "",
    });

    const saved = await newProduct.save();
    return res.status(201).json({ success: true, message: "Product created successfully.", product: saved });
  } catch (error) {
    console.error("[Products] Create error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create product." });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product details, photos, drive link, and sections
// @access  Private (Admin)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.json({ success: true, message: "Product updated successfully.", product });
  } catch (error) {
    console.error("[Products] Update error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update product." });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    console.error("[Products] Delete error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete product." });
  }
});

// @route   POST /api/products/:idOrSlug/reviews
// @desc    Submit a verified customer review & rating
// @access  Public
router.post("/:idOrSlug/reviews", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const { author, rating, title, comment } = req.body;

    if (!author || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Author name, rating (1-5), and review comment are required.",
      });
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));

    let product;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    }
    if (!product) {
      product = await Product.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const newReview = {
      author: author.trim(),
      rating: numericRating,
      title: title ? title.trim() : "",
      comment: comment.trim(),
      date: new Date(),
      verified: true,
    };

    if (!Array.isArray(product.reviews)) {
      product.reviews = [];
    }

    product.reviews.unshift(newReview);

    // Recalculate average rating
    const totalScore = product.reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    product.rating = Number((totalScore / product.reviews.length).toFixed(1));
    product.reviewCount = product.reviews.length;

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully! Thank you for your feedback.",
      rating: product.rating,
      reviewsCount: product.reviewCount,
      reviews: product.reviews,
      newReview,
    });
  } catch (error) {
    console.error("[Products] Review submission error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit review.",
    });
  }
});

module.exports = router;
