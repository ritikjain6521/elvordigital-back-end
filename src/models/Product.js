const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
    categoryName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    fullDescription: { type: String, default: "" },
    price: { type: Number, required: true, default: 0 },
    originalPrice: { type: Number, default: 0 },
    discount: { type: String, default: "" },
    badge: { type: String, default: "" },
    rating: { type: Number, default: 4.9 },
    reviewCount: { type: Number, default: 48 },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isFree: { type: Boolean, default: false },
    productFormat: { type: String, default: "Digital Download" },
    fileSize: { type: String, default: "45 MB" },
    status: {
      type: String,
      enum: ["draft", "published", "unpublished", "archived"],
      default: "published",
    },

    // Point 5 & 8: Photos and Access Deliverable Links
    photos: [{ type: String }],
    thumbnail: { type: String, default: "" },
    googleDriveLink: { type: String, default: "" },
    accessFolderLink: { type: String, default: "" },
    videoLink: { type: String, default: "" },
    downloadFileUrl: { type: String, default: "" },

    // Point 6: Product Details Page Sections Managed by Admin
    // 1. Overview & Deliverables
    deliverables: { type: mongoose.Schema.Types.Mixed, default: [] },
    whatsIncluded: { type: mongoose.Schema.Types.Mixed, default: [] },
    overviewText: { type: String, default: "" },

    // 2. Preview & Features
    features: { type: mongoose.Schema.Types.Mixed, default: [] },
    learningOutcomes: { type: mongoose.Schema.Types.Mixed, default: [] },
    previewVideoUrl: { type: String, default: "" },

    // 3. Comparison & Bonuses
    bonuses: { type: mongoose.Schema.Types.Mixed, default: [] },
    comparison: { type: mongoose.Schema.Types.Mixed, default: [] },

    // 4. Product FAQs
    faqs: { type: mongoose.Schema.Types.Mixed, default: [] },

    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
