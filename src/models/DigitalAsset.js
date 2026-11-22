const mongoose = require("mongoose");

const digitalAssetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fileName: { type: String, default: "" },
    fileType: {
      type: String,
      enum: ["PDF", "ZIP", "DOCX", "PPTX", "XLSX", "MP4", "GOOGLE_DRIVE", "FOLDER", "VIDEO_LINK", "OTHER"],
      default: "ZIP",
    },
    fileSize: { type: String, default: "45 MB" },
    version: { type: String, default: "2026.1" },
    associatedProductId: { type: String, default: "" },
    associatedProductName: { type: String, default: "" },

    // Storage Links & Uploads
    fileUrl: { type: String, default: "" },
    googleDriveLink: { type: String, default: "" },
    accessFolderLink: { type: String, default: "" },
    videoLink: { type: String, default: "" },

    uploadDate: { type: Date, default: Date.now },
    downloadCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DigitalAsset", digitalAssetSchema);
