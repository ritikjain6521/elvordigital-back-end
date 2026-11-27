const express = require("express");
const AccessRecord = require("../models/AccessRecord");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/access/my-library
// @desc    Customer My Library: check active entitlements for an email
// @access  Public (verified by customer email)
router.get("/my-library", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: "Customer email is required." });
    }

    // Only return records where status is 'active' (User must have paid)
    const activeRecords = await AccessRecord.find({
      customerEmail: email.toLowerCase().trim(),
      status: "active",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: activeRecords.length,
      accessRecords: activeRecords,
    });
  } catch (error) {
    console.error("[Access] Library fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve access library." });
  }
});

// @route   GET /api/access
// @desc    Get all access records
// @access  Private (Admin)
router.get("/", protectAdmin, async (req, res) => {
  try {
    const records = await AccessRecord.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: records.length, accessRecords: records });
  } catch (error) {
    console.error("[Access] Admin fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve access ledger." });
  }
});

// @route   POST /api/access/grant
// @desc    Manual grant access
// @access  Private (Admin)
router.post("/grant", protectAdmin, async (req, res) => {
  try {
    const { customerEmail, customerName, productId, productName, googleDriveLink, accessFolderLink, downloadFileUrl } = req.body;

    const record = new AccessRecord({
      customerEmail: customerEmail.toLowerCase().trim(),
      customerName: customerName || "Customer",
      productId,
      productName,
      orderId: `MANUAL-${Date.now().toString().slice(-6)}`,
      googleDriveLink: googleDriveLink || "",
      accessFolderLink: accessFolderLink || "",
      downloadFileUrl: downloadFileUrl || "",
      status: "active",
      accessType: "complimentary",
    });

    const saved = await record.save();
    return res.status(201).json({ success: true, message: "Access entitlement granted.", accessRecord: saved });
  } catch (error) {
    console.error("[Access] Grant error:", error);
    return res.status(500).json({ success: false, message: "Failed to grant access." });
  }
});

// @route   PUT /api/access/:id/revoke
// @desc    Revoke access
// @access  Private (Admin)
router.put("/:id/revoke", protectAdmin, async (req, res) => {
  try {
    const record = await AccessRecord.findByIdAndUpdate(
      req.params.id,
      { status: "revoked" },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: "Record not found." });
    return res.json({ success: true, message: "Access entitlement revoked.", accessRecord: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to revoke access." });
  }
});

// @route   DELETE /api/access/:id
// @desc    Delete access record
// @access  Private (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const deleted = await AccessRecord.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Access record not found." });
    }
    return res.json({ success: true, message: "Access record deleted successfully." });
  } catch (error) {
    console.error("[Access] Delete error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete access record." });
  }
});

module.exports = router;
