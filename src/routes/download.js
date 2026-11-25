const express = require("express");
const Product = require("../models/Product");
const DigitalAsset = require("../models/DigitalAsset");

const router = express.Router();

// @route   GET /api/download/:slugOrId
// @desc    Redirect directly to the admin-configured download URL from Digital Asset Vault & Delivery Files
// @access  Public (Granted to paid order or valid product key)
router.get("/:slugOrId", async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let product = null;

    if (/^[0-9a-fA-F]{24}$/.test(slugOrId)) {
      product = await Product.findById(slugOrId);
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ slug: slugOrId.toLowerCase() }, { sku: slugOrId.toUpperCase() }],
      });
    }

    let downloadUrl = "";
    if (
      product &&
      product.downloadFileUrl &&
      product.downloadFileUrl.trim() &&
      !product.downloadFileUrl.includes("assets.ElvorDigital.com") &&
      !product.downloadFileUrl.includes("/api/download/")
    ) {
      downloadUrl = product.downloadFileUrl.trim();
    }

    if (!downloadUrl) {
      const searchTerms = [
        product ? String(product._id) : null,
        product?.slug,
        product?.name,
        slugOrId,
      ].filter(Boolean);

      const digitalAsset = await DigitalAsset.findOne({
        $or: [
          { associatedProductId: { $in: searchTerms } },
          { associatedProductName: { $in: searchTerms } },
        ],
      }).sort({ createdAt: -1 });

      if (
        digitalAsset &&
        digitalAsset.fileUrl &&
        digitalAsset.fileUrl.trim() &&
        !digitalAsset.fileUrl.includes("assets.ElvorDigital.com") &&
        !digitalAsset.fileUrl.includes("/api/download/")
      ) {
        downloadUrl = digitalAsset.fileUrl.trim();
      }
    }

    if (downloadUrl) {
      if (!downloadUrl.startsWith("http")) {
        const backendBase = process.env.BACKEND_URL || "https://elvordigital-back-end.onrender.com";
        downloadUrl = `${backendBase.replace(/\/+$/, "")}/${downloadUrl.replace(/^\/+/, "")}`;
      }
      return res.redirect(downloadUrl);
    }

    return res.status(404).json({
      success: false,
      message: "No downloadable file configured for this product by admin.",
    });
  } catch (error) {
    console.error("[Download] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Download failed." });
    }
  }
});

module.exports = router;
