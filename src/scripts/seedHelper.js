const AdminUser = require("../models/AdminUser");

const seedDefaultData = async () => {
  try {
    // Seed Admin User only if none exists
    const existingAdmin = await AdminUser.findOne({
      $or: [{ username: "admin" }, { email: "admin@ElvorDigital.com" }],
    });

    if (!existingAdmin) {
      console.log("[Seed] Creating default administrator account...");
      await AdminUser.create({
        username: "admin",
        email: "admin@ElvorDigital.com",
        password: "Admin@123456", // Pre-hashed by model schema pre-save hook
        name: "ElvorDigital Chief Admin",
        role: "OWNER",
        status: "active",
        avatar: "ZA",
      });
      console.log("[Seed] Default Admin created: User ID: 'admin' / 'admin@ElvorDigital.com'");
    }

    console.log("[Seed] Database checks completed successfully.");
  } catch (err) {
    console.error("[Seed] Error during seeding:", err.message);
  }
};

module.exports = seedDefaultData;
