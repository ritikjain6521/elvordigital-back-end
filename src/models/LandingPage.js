const mongoose = require("mongoose");

const landingPageSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productSlug: { type: String, required: true },
    productName: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "published", "unpublished"],
      default: "published",
    },
    views: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    sections: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LandingPage", landingPageSchema);
