const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: __dirname + "/../../.env" });

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI not configured in .env");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const Order = mongoose.model("Order", new mongoose.Schema({}, { strict: false }));
  const AccessRecord = mongoose.model("AccessRecord", new mongoose.Schema({}, { strict: false }));
  const EmailConfig = mongoose.model("EmailConfig", new mongoose.Schema({}, { strict: false }));

  // 1. Update EmailConfig to port 587, tls, ElvorDigital
  await EmailConfig.updateOne(
    {},
    {
      $set: {
        provider: "smtp",
        host: "smtp.hostinger.com",
        port: 587,
        encryption: "tls",
        username: "info@elvordigital.com",
        password: "Ritikjain@1234",
        fromName: "ElvorDigital",
        fromEmail: "info@elvordigital.com",
        replyToEmail: "support@elvordigital.com",
        isVerified: true,
      },
    }
  );
  console.log("Updated EmailConfig in MongoDB.");

  // 2. Update Order ELV-1153 downloadFileUrl
  const newDownloadUrl =
    "https://elvordigital-back-end.onrender.com/uploads/1795370807435-820251001-Ritik_Doc.zip";

  const orderUpdateRes = await Order.updateOne(
    { orderNumber: "ELV-1153" },
    { $set: { "items.0.downloadFileUrl": newDownloadUrl } }
  );
  console.log("Updated Order ELV-1153 downloadFileUrl:", orderUpdateRes.modifiedCount);

  // 3. Update AccessRecord
  const accessUpdateRes = await AccessRecord.updateMany(
    { orderId: "ELV-1153" },
    { $set: { downloadFileUrl: newDownloadUrl } }
  );
  console.log("Updated AccessRecords:", accessUpdateRes.modifiedCount);

  // 4. Fetch the order
  const order = await Order.findOne({ orderNumber: "ELV-1153" });
  if (!order) {
    throw new Error("Order ELV-1153 not found.");
  }

  console.log(`Order customer: ${order.customerName} <${order.customerEmail}>`);

  // 5. Send verified access email via Hostinger Port 587 TLS
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 587,
    secure: false, // port 587 uses STARTTLS, secure must be false
    auth: {
      user: "info@elvordigital.com",
      pass: "Ritikjain@1234",
    },
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: '"ElvorDigital" <info@elvordigital.com>',
    replyTo: "support@elvordigital.com",
    to: order.customerEmail,
    subject: `🎉 Access Granted: Your Order #${order.orderNumber} (${order.items[0]?.productName || "Digital Assets"})`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #090816; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 650px; margin: 0 auto; border: 1px solid #252249;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #8B5CF6; font-size: 26px; margin: 0;">🎉 Access Granted!</h1>
          <p style="color: #22D3EE; font-size: 14px; font-weight: bold; margin-top: 6px;">Order #${order.orderNumber} Confirmed</p>
        </div>

        <p style="color: #e2e8f0; font-size: 15px;">Hello <strong>${order.customerName}</strong>,</p>
        <p style="color: #A7A3BC; font-size: 14px; line-height: 1.6;">
          Your purchase has been verified and processed successfully. Your instant digital asset access and delivery links are ready below:
        </p>

        <div style="background-color: #17152E; border: 1px solid #332f5d; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 6px 0; color: #ffffff; font-size: 16px;">${order.items[0].productName}</h3>
          <p style="margin: 0 0 12px 0; color: #A7A3BC; font-size: 13px;">Format: ${order.items[0].format} • Price: ₹${order.items[0].price}</p>
          <div style="margin-top: 14px;">
            <a href="${order.items[0].googleDriveLink}" target="_blank" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-right: 10px; margin-bottom: 10px;">
              🚀 Open Google Drive Access
            </a>
            <a href="${newDownloadUrl}" target="_blank" style="display: inline-block; background-color: #22D3EE; color: #000000; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-bottom: 10px;">
              ⬇️ Download Master File (ZIP)
            </a>
          </div>
        </div>

        <div style="background-color: #121026; padding: 16px; border-radius: 8px; border: 1px solid #2c2754; font-size: 13px; color: #A7A3BC; margin-top: 24px;">
          <strong style="color: #ffffff;">Order Summary:</strong><br/>
          Order ID: <span style="font-family: monospace; color: #22D3EE;">${order.orderNumber}</span><br/>
          Amount Paid: ₹${order.totalAmount} (via Verified Gateway)<br/>
          License: Verified Commercial Creator & Lifetime Access
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
          Need assistance? Contact our VIP Help Desk at <a href="mailto:support@elvordigital.com" style="color: #8B5CF6;">support@elvordigital.com</a><br/>
          © 2026 ElvorDigital Marketplace Inc.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email dispatched successfully! Message ID:", info.messageId);

  await Order.updateOne(
    { orderNumber: "ELV-1153" },
    { $set: { emailSent: true, emailSentAt: new Date() } }
  );
  console.log("Order ELV-1153 updated: emailSent = true");

  await mongoose.disconnect();
  console.log("Finished successfully!");
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
