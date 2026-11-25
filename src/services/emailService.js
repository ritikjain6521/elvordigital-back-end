const https = require("https");
const nodemailer = require("nodemailer");
const EmailConfig = require("../models/EmailConfig");

// Pure SMTP Email Dispatcher (Nodemailer)
const dispatchEmail = async ({
  to,
  subject,
  html,
  fromName,
  fromEmail,
  replyTo,
  overrideConfig = null,
}) => {
  try {
    const cfg = overrideConfig || (await EmailConfig.findOne().catch(() => null));

    const isPlaceholder = (val) =>
      !val ||
      typeof val !== "string" ||
      val.includes("YOUR_HOSTINGER") ||
      val.includes("EXAMPLE");

    const host =
      overrideConfig?.host ||
      process.env.SMTP_HOST ||
      cfg?.host ||
      "smtp.hostinger.com";

    // Port 587 is standard STARTTLS for cloud environments (Render blocks 465)
    const port =
      Number(overrideConfig?.port) ||
      Number(cfg?.port) ||
      parseInt(process.env.SMTP_PORT, 10) ||
      587;

    const user =
      overrideConfig?.username ||
      (!isPlaceholder(process.env.SMTP_USER) ? process.env.SMTP_USER : null) ||
      cfg?.username ||
      "info@elvordigital.com";

    const pass =
      overrideConfig?.password ||
      (!isPlaceholder(process.env.SMTP_PASS) ? process.env.SMTP_PASS : null) ||
      cfg?.password ||
      "";

    // Port 465 is SSL (secure: true). Port 587 is STARTTLS (secure: false).
    const secure =
      overrideConfig?.secure !== undefined
        ? Boolean(overrideConfig.secure)
        : port === 465;

    const resolvedFromName =
      fromName ||
      overrideConfig?.fromName ||
      process.env.FROM_NAME ||
      cfg?.fromName ||
      "ElvorDigital";

    const resolvedFromEmail =
      fromEmail ||
      overrideConfig?.fromEmail ||
      process.env.FROM_EMAIL ||
      cfg?.fromEmail ||
      user ||
      "info@elvordigital.com";

    const resolvedReplyTo =
      replyTo ||
      overrideConfig?.replyToEmail ||
      process.env.REPLY_TO ||
      cfg?.replyToEmail ||
      "support@elvordigital.com";

    if (!user || !pass) {
      throw new Error("SMTP_USER or SMTP_PASS is missing. Configure SMTP credentials first.");
    }

    const isRender = Boolean(
      process.env.RENDER ||
      process.env.RENDER_SERVICE_ID ||
      process.env.NODE_ENV === "production"
    );

    const postJsonHttps = (urlStr, payload, timeoutMs = 15000) => {
      return new Promise((resolve, reject) => {
        const parsed = new URL(urlStr);
        const data = JSON.stringify(payload);
        const req = https.request(
          {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(data),
            },
            timeout: timeoutMs,
          },
          (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
              try {
                const json = JSON.parse(body);
                resolve({ status: res.statusCode, data: json });
              } catch {
                reject(new Error(`Invalid JSON from relay (HTTP ${res.statusCode}): ${body.slice(0, 200)}`));
              }
            });
          }
        );
        req.on("timeout", () => {
          req.destroy();
          reject(new Error(`HTTPS relay request timed out after ${timeoutMs}ms`));
        });
        req.on("error", (err) => reject(err));
        req.write(data);
        req.end();
      });
    };

    const sendViaVercelRelay = async () => {
      const relayUrl =
        process.env.EMAIL_RELAY_URL ||
        "https://elvordigital.com/api/send-email";
      const relaySecret =
        process.env.EMAIL_RELAY_SECRET || "elvordigital_smtp_relay_2026";

      const { status, data: relayData } = await postJsonHttps(
        relayUrl,
        {
          secret: relaySecret,
          to,
          subject,
          html,
          fromName: resolvedFromName,
          fromEmail: resolvedFromEmail,
          replyTo: resolvedReplyTo,
          smtpConfig: { host, port, user, pass },
        },
        18000
      );

      if (status >= 400 || !relayData.success) {
        throw new Error(relayData?.error || `SMTP relay HTTP ${status}`);
      }

      console.log(`[Email Service] Dispatched via Vercel SMTP relay. Message ID:`, relayData.messageId);
      return {
        success: true,
        method: relayData.method || "vercel-smtp-relay",
        messageId: relayData.messageId,
        response: relayData.response,
      };
    };

    if (isRender) {
      return await sendViaVercelRelay();
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 6000,
      });

      const info = await transporter.sendMail({
        from: `"${resolvedFromName}" <${resolvedFromEmail}>`,
        replyTo: resolvedReplyTo,
        to,
        subject,
        html,
      });

      console.log(`[Email Service] Dispatched via direct SMTP (${host}:${port}). Message ID:`, info.messageId);
      return { success: true, method: "smtp", messageId: info.messageId, response: info.response };
    } catch (directSmtpErr) {
      console.warn(`[Email Service] Direct SMTP (${host}:${port}) failed (${directSmtpErr.message}), attempting HTTPS->SMTP relay via Vercel...`);
      return await sendViaVercelRelay();
    }
  } catch (smtpErr) {
    console.error("[Email Service] All SMTP dispatch methods failed:", smtpErr.message);
    return { success: false, error: smtpErr.message };
  }
};

// Send real-time test diagnostic email
const sendDiagnosticEmail = async (toEmail, testConfig = null) => {
  const cfg = testConfig || (await EmailConfig.findOne().catch(() => null));
  const fromName = testConfig?.fromName || process.env.FROM_NAME || cfg?.fromName || "ElvorDigital";
  const fromEmail =
    testConfig?.fromEmail ||
    process.env.FROM_EMAIL ||
    cfg?.fromEmail ||
    "info@elvordigital.com";

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #090816; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #252249;">
      <h2 style="color: #8B5CF6; margin-top: 0;">⚡ ElvorDigital SMTP Email Verified</h2>
      <p style="color: #A7A3BC; font-size: 14px;">Your ElvorDigital marketplace SMTP email configuration is transmitting live messages successfully.</p>
      <div style="background-color: #17152E; padding: 15px; border-radius: 8px; border: 1px solid #322f5a; margin: 20px 0;">
        <p style="margin: 4px 0; font-size: 13px; color: #22D3EE;"><strong>Sender:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
        <p style="margin: 4px 0; font-size: 13px; color: #A7A3BC;"><strong>Recipient:</strong> ${toEmail}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #A7A3BC;"><strong>Dispatched At:</strong> ${new Date().toISOString()}</p>
      </div>
      <p style="color: #8B5CF6; font-size: 12px;">© 2026 ElvorDigital Marketplace Inc. • Automated SMTP Delivery</p>
    </div>
  `;

  return await dispatchEmail({
    to: toEmail,
    subject: "⚡ ElvorDigital SMTP Email Connection Verified",
    html,
    fromName,
    fromEmail,
    overrideConfig: testConfig,
  });
};

// Send instant product access email with Digital Asset Vault & Delivery Files upon verified payment
const sendProductAccessEmail = async ({ customerEmail, customerName, orderNumber, items, totalAmount }) => {
  try {
    const cfg = await EmailConfig.findOne().catch(() => null);
    const fromName = process.env.FROM_NAME || cfg?.fromName || "ElvorDigital";
    const fromEmail = process.env.FROM_EMAIL || cfg?.fromEmail || "info@elvordigital.com";
    const clientUrl = process.env.CLIENT_URL || "https://elvordigital-front-end.vercel.app";
    const backendBaseUrl = process.env.BACKEND_URL || "https://elvordigital-back-end.onrender.com";

    const itemsHtml = (items || [])
      .map((item) => {
        const driveUrl = item.googleDriveLink && item.googleDriveLink.trim() ? item.googleDriveLink.trim() : "";
        const rawFolderUrl = item.accessFolderLink && item.accessFolderLink.trim() ? item.accessFolderLink.trim() : "";
        const folderUrl = rawFolderUrl
          ? rawFolderUrl.startsWith("/")
            ? `${clientUrl}${rawFolderUrl}`
            : rawFolderUrl
          : "";
        const rawDownloadUrl = item.downloadFileUrl && item.downloadFileUrl.trim() ? item.downloadFileUrl.trim() : "";
        const downloadUrl = rawDownloadUrl
          ? rawDownloadUrl.startsWith("http")
            ? rawDownloadUrl
            : `${backendBaseUrl.replace(/\/+$/, "")}/${rawDownloadUrl.replace(/^\/+/, "")}`
          : "";
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
          Your purchase has been verified and processed successfully. Your instant digital asset access and delivery links are ready below:
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
          Need assistance? Contact our VIP Help Desk at <a href="mailto:support@elvordigital.com" style="color: #8B5CF6;">support@elvordigital.com</a><br/>
          © 2026 ElvorDigital Marketplace Inc.
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
