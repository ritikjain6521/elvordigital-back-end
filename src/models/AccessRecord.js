const mongoose = require("mongoose");

const accessRecordSchema = new mongoose.Schema(
  {
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerName: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    orderId: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "pending", "expired", "revoked", "suspended"],
      default: "active",
    },
    expiryDate: { type: String, default: "Lifetime" },
    downloadLimit: { type: Number, default: 5 },
    downloadCount: { type: Number, default: 0 },
    accessType: { type: String, default: "purchase" },
    googleDriveLink: { type: String, default: "" },
    accessFolderLink: { type: String, default: "" },
    downloadFileUrl: { type: String, default: "" },
    videoLink: { type: String, default: "" },
    accessToken: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    lastAccessed: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessRecord", accessRecordSchema);
