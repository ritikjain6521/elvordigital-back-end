/**
 * Full end-to-end simulation: Create a fake paid order → send product access email
 * Simulates exactly what happens when a real user buys from checkout
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../../.env" });

const { sendProductAccessEmail } = require("../services/emailService");
const Order = require("../models/Order");
const AccessRecord = require("../models/AccessRecord");

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  // === Change this to any test email ===
  const testEmail = process.argv[2] || "ritikjain6224@gmail.com";
  const testName = "Test Customer";
  const orderNumber = `ELV-TEST-${Date.now()}`;

  console.log(`\n📧 Sending test order access email to: ${testEmail}`);
  console.log(`📦 Simulated Order: ${orderNumber}\n`);

  // Simulate exactly what /api/payment/verify sends to sendProductAccessEmail
  const fakeOrderItems = [
    {
      productName: "Creator Productivity Toolkit",
      format: "GOOGLE_DRIVE (Creator Productivity Toolkit)",
      price: 399,
      quantity: 1,
      fileType: "GOOGLE_DRIVE",
      googleDriveLink: "https://drive.google.com/drive/folders/1ufyJw2oFDtEH6nbMtxcLL4-8H2wqNGRk?usp=drive_link",
      accessFolderLink: "",
      downloadFileUrl: "https://elvordigital-back-end.onrender.com/uploads/1795370807435-820251001-Ritik_Doc.zip",
      videoLink: "",
    },
  ];

  const result = await sendProductAccessEmail({
    customerEmail: testEmail,
    customerName: testName,
    orderNumber: orderNumber,
    items: fakeOrderItems,
    totalAmount: 399,
  });

  console.log("📬 Email Dispatch Result:", result);

  if (result.success) {
    console.log(`\n✅ SUCCESS! Email sent to ${testEmail}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`\n   This confirms the full checkout→email flow is working correctly.`);
    console.log(`   Every new purchase will auto-send this email.\n`);
  } else {
    console.error(`\n❌ FAILED! Email was NOT sent.`);
    console.error(`   Error: ${result.error}`);
    console.error(`\n   Check your Render environment SMTP_PASS setting.\n`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Script error:", err.message);
  process.exit(1);
});
