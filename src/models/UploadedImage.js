const mongoose = require("mongoose");

const uploadedImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UploadedImage", uploadedImageSchema);
