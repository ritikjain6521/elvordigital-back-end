const mongoose = require("mongoose");

const emailConfigSchema = new mongoose.Schema(
  {
    provider: { type: String, default: "smtp" },
    host: { type: String, default: "smtp.gmail.com" },
    port: { type: Number, default: 587 },
    encryption: { type: String, enum: ["tls", "ssl", "none"], default: "tls" },
    username: { type: String, default: "" },
    password: { type: String, default: "" },
    fromName: { type: String, default: "ZenovaVibe Access" },
    fromEmail: { type: String, default: "access@zenovavibe.com" },
    replyToEmail: { type: String, default: "support@zenovavibe.com" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailConfig", emailConfigSchema);
