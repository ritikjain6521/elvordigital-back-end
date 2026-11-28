const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const DigitalAsset = require("../models/DigitalAsset");
const Product = require("../models/Product");
const UploadedImage = require("../models/UploadedImage");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
});

const imageMemoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit for MongoDB-stored images
});

// @route   GET /api/assets/image/:id
// @desc    Serve permanently stored image from MongoDB
// @access  Public
router.get("/image/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(404).send("Image not found");
    }
    const img = await UploadedImage.findById(id);
    if (!img) {
      return res.status(404).send("Image not found");
    }
    res.setHeader("Content-Type", img.mimeType || "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(img.data);
  } catch (error) {
    console.error("[Assets] Image serve error:", error);
    return res.status(500).send("Failed to load image");
  }
});

// @route   POST /api/assets/upload
// @desc    Upload product image (persisted in MongoDB) or large file/archive
// @access  Private (Admin)
router.post("/upload", protectAdmin, (req, res, next) => {
  // Handle upload with multer disk storage, then persist images into MongoDB
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "File upload error." });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
      }

      const fileSizeMb = (req.file.size / (1024 * 1024)).toFixed(1) + " MB";

      // Persist images permanently in MongoDB so ephemeral disk restarts never break them
      if (req.file.mimetype && req.file.mimetype.startsWith("image/") && req.file.size <= 15 * 1024 * 1024) {
        const buffer = fs.readFileSync(req.file.path);
        const savedImage = await UploadedImage.create({
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          data: buffer,
        });

        const fileUrl = `/api/assets/image/${savedImage._id}`;
        return res.json({
          success: true,
          message: "Image uploaded and persisted to MongoDB.",
          fileName: req.file.originalname,
          fileUrl,
          fileSize: fileSizeMb,
          mimeType: req.file.mimetype,
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      return res.json({
        success: true,
        message: "File uploaded successfully.",
        fileName: req.file.originalname,
        fileUrl,
        fileSize: fileSizeMb,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      console.error("[Assets] Upload error:", error);
      return res.status(500).json({ success: false, message: "File upload failed." });
    }
  });
});

// @route   GET /api/assets
// @desc    List all digital assets
router.get("/", async (req, res) => {
  try {
    const assets = await DigitalAsset.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: assets.length, assets });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch assets." });
  }
});

// @route   POST /api/assets
// @desc    Create new digital asset entry and bind links to associated Product
// @access  Private (Admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const {
      name,
      fileName,
      fileType,
      fileSize,
      version,
      associatedProductId,
      associatedProductName,
      fileUrl,
      googleDriveLink,
      accessFolderLink,
      videoLink,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Asset name is required." });
    }

    // 1. Create DigitalAsset record
    const asset = new DigitalAsset({
      name,
      fileName: fileName || name,
      fileType: fileType || "ZIP",
      fileSize: fileSize || "25 MB",
      version: version || "2026.1",
      associatedProductId: associatedProductId || "",
      associatedProductName: associatedProductName || "",
      fileUrl: fileUrl || "",
      googleDriveLink: googleDriveLink || "",
      accessFolderLink: accessFolderLink || "",
      videoLink: videoLink || "",
      status: "active",
    });

    const saved = await asset.save();

    // 2. Synchronize deliverable links with associated Product in MongoDB
    try {
      const updateFields = {};
      if (googleDriveLink && googleDriveLink.trim()) updateFields.googleDriveLink = googleDriveLink.trim();
      if (accessFolderLink && accessFolderLink.trim()) updateFields.accessFolderLink = accessFolderLink.trim();
      if (videoLink && videoLink.trim()) updateFields.videoLink = videoLink.trim();
      if (fileUrl && fileUrl.trim()) updateFields.downloadFileUrl = fileUrl.trim();
      if (fileType) updateFields.productFormat = `${fileType} (${name})`;

      if (Object.keys(updateFields).length > 0) {
        if (associatedProductId && /^[0-9a-fA-F]{24}$/.test(associatedProductId)) {
          await Product.findByIdAndUpdate(associatedProductId, { $set: updateFields });
        } else if (associatedProductId) {
          await Product.findOneAndUpdate(
            { $or: [{ slug: associatedProductId }, { name: associatedProductName }] },
            { $set: updateFields }
          );
        } else if (associatedProductName) {
          await Product.findOneAndUpdate({ name: associatedProductName }, { $set: updateFields });
        }
        console.log(`[Assets] Synced product deliverable links for product: ${associatedProductName || associatedProductId}`);
      }
    } catch (syncErr) {
      console.warn("[Assets] Product link sync warning:", syncErr.message);
    }

    return res.status(201).json({ success: true, message: "Digital asset registered & linked to product.", asset: saved });
  } catch (error) {
    console.error("[Assets] Create error:", error);
    return res.status(500).json({ success: false, message: "Failed to create digital asset." });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete asset
// @access  Private (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const deleted = await DigitalAsset.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Asset not found." });
    return res.json({ success: true, message: "Asset removed." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete asset." });
  }
});

module.exports = router;
