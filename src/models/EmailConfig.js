const mongoose = require("mongoose");

const emailConfigSchema = new mongoose.Schema(
  {
    provider: { type: String, default: "smtp" },
    host: { type: String, default: "smtp.hostinger.com" },
    port: { type: Number, default: 465 },
    encryption: { type: String, enum: ["tls", "ssl", "none"], default: "ssl" },
    username: { type: String, default: "" },
    password: { type: String, default: "" },
    fromName: { type: String, default: "ElvoraDigital" },
    fromEmail: { type: String, default: "info@elvordigital.com" },
    replyToEmail: { type: String, default: "support@elvordigital.com" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailConfig", emailConfigSchema);
