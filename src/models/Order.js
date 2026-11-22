const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  format: { type: String, default: "Digital Download" },
  fileType: { type: String, default: "" },
  assetTitle: { type: String, default: "" },
  googleDriveLink: { type: String, default: "" },
  accessFolderLink: { type: String, default: "" },
  downloadFileUrl: { type: String, default: "" },
  videoLink: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: String, default: "" },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String, default: "" },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "failed", "refunded"],
      default: "paid",
    },
    paymentMethod: { type: String, default: "RAZORPAY" },
    accessStatus: {
      type: String,
      enum: ["granted", "pending", "revoked"],
      default: "granted",
    },
    couponUsed: { type: String, default: "" },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
