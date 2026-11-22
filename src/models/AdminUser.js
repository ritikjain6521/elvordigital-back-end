const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["OWNER", "SUPER_ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER", "MARKETING_MANAGER", "SUPPORT_AGENT"],
      default: "SUPER_ADMIN",
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    avatar: { type: String, default: "AD" },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

adminUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("AdminUser", adminUserSchema);
