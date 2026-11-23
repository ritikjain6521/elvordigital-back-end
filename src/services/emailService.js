const nodemailer = require("nodemailer");
const EmailConfig = require("../models/EmailConfig");

// Universal Email Transporter / Dispatcher (Supports Google Apps Script Webhook, Resend API, & SMTP)
const dispatchEmail = async ({ to, subject, html, fromName = "ElvoraDigital Access", fromEmail = "access@elvoradigital.com" }) => {
  const cfg = await EmailConfig.findOne().catch(() => null);

  const googleScriptUrl =
    process.env.GOOGLE_SCRIPT_WEBHOOK_URL || (cfg && cfg.googleScriptUrl) || "";
  const resendApiKey =
    process.env.RESEND_API_KEY || (cfg && cfg.resendApiKey) || "";

  // 1. OPTION 1: Google Apps Script Webhook (100% Free Vercel / Render Gmail delivery without port blocking)
  if (googleScriptUrl && googleScriptUrl.trim().startsWith("http")) {
    try {
      console.log("[Email Service] Dispatching via Google Apps Script Webhook (Option 1)...");
      const response = await fetch(googleScriptUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          html,
          fromName,
        }),
      });

      const resText = await response.text();
      console.log("[Email Service] Google Apps Script response:", resText);
      return { success: true, method: "google_apps_script", response: resText };
    } catch (gErr) {
      console.warn("[Email Service] Google Apps Script webhook failed, falling back to SMTP:", gErr.message);
    }
  }

  // 2. OPTION 2: Resend API Key (HTTPS REST API for custom domain production delivery)
  if (resendApiKey && resendApiKey.trim().length > 5) {
    try {
      console.log("[Email Service] Dispatching via Resend API (Option 2)...");
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject,
          html,
        }),
      });

      const resendData = await resendRes.json();
      console.log("[Email Service] Resend response:", resendData);
      return { success: true, method: "resend", data: resendData };
    } catch (rErr) {
      console.warn("[Email Service] Resend API failed, falling back to SMTP:", rErr.message);
    }
  }

  // 3. OPTION 3: Direct SMTP (Gmail App Password / Custom SMTP)
  try {
    const host = cfg?.host || process.env.SMTP_HOST || "smtp.gmail.com";
    const port = cfg?.port || parseInt(process.env.SMTP_PORT) || 465;
    const user = cfg?.username || process.env.SMTP_USER || "";
    const pass = cfg?.password || process.env.SMTP_PASS || "";
    const secure = cfg?.encryption === "ssl" || port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: { rejectUnauthorized: false },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log("[Email Service] Dispatched via SMTP. Message ID:", info.messageId);
    return { success: true, method: "smtp", messageId: info.messageId, response: info.response };
  } catch (smtpErr) {
    console.error("[Email Service] SMTP dispatch failed:", smtpErr.message);
    return { success: false, error: smtpErr.message };
  }
};

// Send real-time test diagnostic email
const sendDiagnosticEmail = async (toEmail, testConfig = null) => {
  const cfg = testConfig || (await EmailConfig.findOne().catch(() => null));
  const fromName = cfg?.fromName || process.env.FROM_NAME || "ElvoraDigital Access";
  const fromEmail = cfg?.fromEmail || process.env.FROM_EMAIL || "ritikjain6224@gmail.com";

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #090816; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #252249;">
      <h2 style="color: #8B5CF6; margin-top: 0;">⚡ ElvoraDigital Production Email Verified</h2>
      <p style="color: #A7A3BC; font-size: 14px;">Your ElvoraDigital marketplace email configuration is transmitting live messages successfully.</p>
      <div style="background-color: #17152E; padding: 15px; border-radius: 8px; border: 1px solid #322f5a; margin: 20px 0;">
        <p style="margin: 4px 0; font-size: 13px; color: #22D3EE;"><strong>Sender:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
        <p style="margin: 4px 0; font-size: 13px; color: #A7A3BC;"><strong>Recipient:</strong> ${toEmail}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #A7A3BC;"><strong>Dispatched At:</strong> ${new Date().toISOString()}</p>
      </div>
      <p style="color: #8B5CF6; font-size: 12px;">© 2026 ElvoraDigital Marketplace Inc. • Automated Email Delivery</p>
    </div>
  `;

  return await dispatchEmail({
    to: toEmail,
    subject: "⚡ ElvoraDigital Production Email Connection Verified",
    html,
    fromName,
    fromEmail,
  });
};

// Send instant product access email with Google Drive link and downloads upon verified payment
const sendProductAccessEmail = async ({ customerEmail, customerName, orderNumber, items, totalAmount }) => {
  try {
    const cfg = await EmailConfig.findOne().catch(() => null);
    const fromName = cfg?.fromName || process.env.FROM_NAME || "ElvoraDigital Digital Access";
    const fromEmail = cfg?.fromEmail || process.env.FROM_EMAIL || "ritikjain6224@gmail.com";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const itemsHtml = (items || [])
      .map((item) => {
        const driveUrl = item.googleDriveLink && item.googleDriveLink.trim() ? item.googleDriveLink.trim() : "";
        const folderUrl = item.accessFolderLink && item.accessFolderLink.trim() ? item.accessFolderLink.trim() : "";
        const downloadUrl = item.downloadFileUrl && item.downloadFileUrl.trim() ? item.downloadFileUrl.trim() : "";
        const videoUrl = item.videoLink && item.videoLink.trim() ? item.videoLink.trim() : "";

        const buttons = [];

        if (driveUrl) {
          buttons.push(`
            <a href="${driveUrl}" target="_blank" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; padding: 11px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-right: 8px; margin-bottom: 8px;">
              🚀 Open Google Drive Folder
            </a>
          `);
        }

        if (folderUrl) {
          buttons.push(`
            <a href="${folderUrl}" target="_blank" style="display: inline-block; background-color: #1e1b4b; border: 1px solid #6366F1; color: #a5b4fc; padding: 11px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-right: 8px; margin-bottom: 8px;">
              📁 Open Cloud Resource Folder
            </a>
          `);
        }

        if (videoUrl) {
          buttons.push(`
            <a href="${videoUrl}" target="_blank" style="display: inline-block; background-color: #be185d; color: #ffffff; padding: 11px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-right: 8px; margin-bottom: 8px;">
              🎬 Watch Video Lessons / Portal
            </a>
          `);
        }

        if (downloadUrl) {
          buttons.push(`
            <a href="${downloadUrl}" target="_blank" style="display: inline-block; background-color: #22D3EE; color: #000000; padding: 11px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-right: 8px; margin-bottom: 8px;">
              ⬇️ Download Master Deliverable
            </a>
          `);
        }

        if (buttons.length === 0) {
          buttons.push(`
            <a href="${clientUrl}/my-library?email=${encodeURIComponent(customerEmail)}" target="_blank" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; padding: 11px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-bottom: 8px;">
              ⚡ Access in Customer Library Portal
            </a>
          `);
        }

        return `
          <div style="background-color: #17152E; border: 1px solid #332f5d; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 6px 0; color: #ffffff; font-size: 16px;">${item.productName}</h3>
            <p style="margin: 0 0 12px 0; color: #A7A3BC; font-size: 13px;">Format: ${item.format || "Digital Master"} • Price: ₹${item.price}</p>
            <div style="margin-top: 10px;">
              ${buttons.join("")}
            </div>
          </div>
        `;
      })
      .join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #090816; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 650px; margin: 0 auto; border: 1px solid #252249;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #8B5CF6; font-size: 26px; margin: 0;">🎉 Access Granted!</h1>
          <p style="color: #22D3EE; font-size: 14px; font-weight: bold; margin-top: 6px;">Order #${orderNumber} Confirmed</p>
        </div>

        <p style="color: #e2e8f0; font-size: 15px;">Hello <strong>${customerName}</strong>,</p>
        <p style="color: #A7A3BC; font-size: 14px; line-height: 1.6;">
          Your purchase has been verified and processed successfully. Your instant Google Drive folders, cloud vault portals, and master download deliverables are ready below:
        </p>

        <div style="margin: 24px 0;">
          ${itemsHtml}
        </div>

        <div style="background-color: #121026; padding: 16px; border-radius: 8px; border: 1px solid #2c2754; font-size: 13px; color: #A7A3BC; margin-top: 24px;">
          <strong style="color: #ffffff;">Order Summary:</strong><br/>
          Order ID: <span style="font-family: monospace; color: #22D3EE;">${orderNumber}</span><br/>
          Amount Paid: ₹${totalAmount} (via Verified Gateway)<br/>
          License: Verified Commercial Creator & Lifetime Access
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
          Need assistance? Contact our VIP Help Desk at <a href="mailto:support@elvoradigital.com" style="color: #8B5CF6;">support@elvoradigital.com</a><br/>
          © 2026 ElvoraDigital Marketplace Inc.
        </p>
      </div>
    `;

    return await dispatchEmail({
      to: customerEmail,
      subject: `🎉 Access Granted: Your Order #${orderNumber} (${items[0]?.productName || "Digital Assets"})`,
      html: emailHtml,
      fromName,
      fromEmail,
    });
  } catch (error) {
    console.error("[Email Service] Access email failed:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  dispatchEmail,
  sendDiagnosticEmail,
  sendProductAccessEmail,
};
