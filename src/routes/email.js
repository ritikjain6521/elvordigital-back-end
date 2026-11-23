const express = require("express");
const EmailConfig = require("../models/EmailConfig");
const { sendDiagnosticEmail } = require("../services/emailService");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/email/config
// @desc    Get current SMTP settings
// @access  Private (Admin)
router.get("/config", protectAdmin, async (req, res) => {
  try {
    let config = await EmailConfig.findOne();
    if (!config) {
      config = await EmailConfig.create({
        provider: "smtp",
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        encryption: "tls",
        username: process.env.SMTP_USER || "access@elvoradigital.com",
        password: process.env.SMTP_PASS || "",
        fromName: process.env.FROM_NAME || "ElvoraDigital Access",
        fromEmail: process.env.FROM_EMAIL || "access@elvoradigital.com",
        replyToEmail: process.env.REPLY_TO || "support@elvoradigital.com",
        isVerified: false,
      });
    }
    return res.json({ success: true, config });
  } catch (error) {
    console.error("[Email] Get config error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve email config." });
  }
});

// @route   PUT /api/email/config
// @desc    Save updated SMTP config
// @access  Private (Admin)
router.put("/config", protectAdmin, async (req, res) => {
  try {
    const updates = req.body;
    let config = await EmailConfig.findOne();

    if (!config) {
      config = new EmailConfig(updates);
    } else {
      Object.assign(config, updates);
    }

    const saved = await config.save();
    return res.json({ success: true, message: "Email configuration saved to database.", config: saved });
  } catch (error) {
    console.error("[Email] Update config error:", error);
    return res.status(500).json({ success: false, message: "Failed to update email config." });
  }
});

// @route   POST /api/email/test
// @desc    Send live diagnostic test email
// @access  Private (Admin)
router.post("/test", protectAdmin, async (req, res) => {
  try {
    const { toEmail, testConfig } = req.body;

    if (!toEmail) {
      return res.status(400).json({ success: false, message: "Destination email is required." });
    }

    const info = await sendDiagnosticEmail(toEmail, testConfig);

    // Update isVerified flag
    await EmailConfig.findOneAndUpdate({}, { isVerified: true });

    return res.json({
      success: true,
      message: `Diagnostic test email dispatched to ${toEmail}. Message ID: ${info.messageId}`,
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error) {
    console.error("[Email] Diagnostic test error:", error);
    return res.status(500).json({ success: false, message: `SMTP Verification failed: ${error.message}` });
  }
});

module.exports = router;
