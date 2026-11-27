const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AccessRecord = require("../models/AccessRecord");
const DigitalAsset = require("../models/DigitalAsset");
const { sendProductAccessEmail } = require("../services/emailService");

const router = express.Router();

const resolveDirectDownloadUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const backendBase = process.env.BACKEND_URL || "https://elvordigital-back-end.onrender.com";
  return `${backendBase.replace(/\/+$/, "")}/${trimmed.replace(/^\/+/, "")}`;
};

async function enrichOrderItems(items) {
  let primarySuperProfileUrl = "";

  const enrichedItems = await Promise.all(
    (items || []).map(async (item) => {
      let prod = null;
      let digitalAsset = null;

      try {
        if (item.productId && /^[0-9a-fA-F]{24}$/.test(item.productId)) {
          prod = await Product.findById(item.productId);
        }
        if (!prod && item.productId) {
          prod = await Product.findOne({
            $or: [{ slug: item.productId }, { sku: item.productId }],
          });
        }
        if (!prod && item.productName) {
          prod = await Product.findOne({ name: item.productName });
        }

        if (!primarySuperProfileUrl && prod?.superProfileUrl?.trim()) {
          primarySuperProfileUrl = prod.superProfileUrl.trim();
        } else if (!primarySuperProfileUrl && item.superProfileUrl?.trim()) {
          primarySuperProfileUrl = item.superProfileUrl.trim();
        }

        const prodId = prod ? String(prod._id) : item.productId;
        const prodName = prod ? prod.name : item.productName;
        const searchTerms = [prodId, item.productId, prod?.slug, prodName, item.productName].filter(Boolean);
        const safeRegexName = (prodName || item.productName || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        digitalAsset = await DigitalAsset.findOne({
          $or: [
            { associatedProductId: { $in: searchTerms } },
            { associatedProductName: { $in: searchTerms } },
            ...(safeRegexName ? [{ associatedProductName: new RegExp(`^${safeRegexName}`, "i") }] : []),
          ],
        }).sort({ createdAt: -1 });
      } catch (e) {
        console.warn("[Payment] Deliverables lookup warning:", e.message);
      }

      let directFileDownload = "";
      const prodDownload = prod?.downloadFileUrl?.trim() || "";
      const assetDownload = digitalAsset?.fileUrl?.trim() || "";
      const itemDownload = item?.downloadFileUrl?.trim() || "";

      if (prodDownload && !prodDownload.includes("assets.ElvorDigital.com") && !prodDownload.includes("/api/download/")) {
        directFileDownload = resolveDirectDownloadUrl(prodDownload);
      } else if (assetDownload && !assetDownload.includes("assets.ElvorDigital.com") && !assetDownload.includes("/api/download/")) {
        directFileDownload = resolveDirectDownloadUrl(assetDownload);
      } else if (itemDownload && !itemDownload.includes("assets.ElvorDigital.com") && !itemDownload.includes("/api/download/")) {
        directFileDownload = resolveDirectDownloadUrl(itemDownload);
      }

      let googleDriveLink =
        (prod && prod.googleDriveLink && prod.googleDriveLink.trim()) ||
        (digitalAsset && digitalAsset.googleDriveLink && digitalAsset.googleDriveLink.trim()) ||
        (item.googleDriveLink && item.googleDriveLink.trim()) ||
        "";
      if (googleDriveLink.includes("1ElvorDigital") || googleDriveLink.includes("1EXAMPLE_REAL")) {
        googleDriveLink = "";
      }

      let accessFolderLink =
        (prod && prod.accessFolderLink && prod.accessFolderLink.trim()) ||
        (digitalAsset && digitalAsset.accessFolderLink && digitalAsset.accessFolderLink.trim()) ||
        (item.accessFolderLink && item.accessFolderLink.trim()) ||
        "";
      if (accessFolderLink.includes("cloud.ElvorDigital.com")) {
        accessFolderLink = "";
      }

      const videoLink =
        (prod && prod.videoLink && prod.videoLink.trim()) ||
        (digitalAsset && digitalAsset.videoLink && digitalAsset.videoLink.trim()) ||
        (item.videoLink && item.videoLink.trim()) ||
        "";

      return {
        productId: item.productId || (prod ? String(prod._id) : "digital-product"),
        productName: item.productName || prod?.name || "Digital Product",
        price: Number(item.price || prod?.price || 0),
        quantity: item.quantity || 1,
        format: item.format || prod?.productFormat || "Digital Download",
        fileType: digitalAsset?.fileType || "ZIP",
        assetTitle: digitalAsset?.name || prod?.name || item.productName,
        googleDriveLink,
        accessFolderLink,
        downloadFileUrl: directFileDownload,
        videoLink,
      };
    })
  );

  return { enrichedItems, primarySuperProfileUrl };
}

async function grantOrderAccessAndSendEmail(order) {
  if (!order) return { emailDispatched: false };

  const alreadyGranted = order.paymentStatus === "paid" && order.accessStatus === "granted";

  order.paymentStatus = "paid";
  order.accessStatus = "granted";
  order.paymentMethod = "SUPERPROFILE";
  await order.save();

  if (!alreadyGranted) {
    for (const item of order.items) {
      await AccessRecord.create({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        productId: item.productId,
        productName: item.productName,
        orderId: order.orderNumber,
        googleDriveLink: item.googleDriveLink || "",
        accessFolderLink: item.accessFolderLink || "",
        downloadFileUrl: item.downloadFileUrl || "",
        videoLink: item.videoLink || "",
        status: "active",
      });

      try {
        if (item.productId && /^[0-9a-fA-F]{24}$/.test(item.productId)) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { totalSales: item.quantity, totalRevenue: item.price * item.quantity },
          });
        } else {
          await Product.findOneAndUpdate(
            { $or: [{ slug: item.productId }, { name: item.productName }] },
            { $inc: { totalSales: item.quantity, totalRevenue: item.price * item.quantity } }
          );
        }
      } catch {
        // Non-blocking stats
      }
    }
  }

  let emailDispatched = Boolean(order.emailSent);
  if (!order.emailSent && order.customerEmail) {
    const emailResult = await Promise.race([
      sendProductAccessEmail({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
      }),
      new Promise((resolve) =>
        setTimeout(() => resolve({ success: false, error: "Email dispatch timed out" }), 8000)
      ),
    ]);

    if (emailResult.success) {
      order.emailSent = true;
      order.emailSentAt = new Date();
      await order.save();
      emailDispatched = true;
    }
  }

  return { emailDispatched };
}

// @route   POST /api/payment/superprofile-init
// @desc    Create pending SuperProfile order in MongoDB and return SuperProfile payment link
router.post("/superprofile-init", async (req, res) => {
  try {
    const { amount, customerName, customerEmail, customerPhone, items, subtotal, discount } = req.body;

    if (!customerEmail || !customerEmail.trim()) {
      return res.status(400).json({ success: false, message: "Customer email is required for digital delivery." });
    }

    const orderNumber = `ELV-${Math.floor(1000 + Math.random() * 9000)}`;
    const { enrichedItems, primarySuperProfileUrl } = await enrichOrderItems(items);

    const newOrder = new Order({
      orderNumber,
      customerName: customerName || "Customer",
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone || "",
      items: enrichedItems,
      subtotal: Number(subtotal || amount || 0),
      discount: Number(discount || 0),
      totalAmount: Number(amount || 0),
      paymentStatus: "pending",
      paymentMethod: "SUPERPROFILE",
      accessStatus: "pending",
      couponUsed: req.body.couponUsed || "",
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      orderNumber,
      superProfileUrl: primarySuperProfileUrl,
      order: newOrder,
    });
  } catch (error) {
    console.error("[SuperProfile] Init error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize SuperProfile checkout.",
    });
  }
});

// @route   POST /api/payment/superprofile-confirm
// @desc    Confirm SuperProfile payment, grant access in MongoDB, and send delivery email
router.post("/superprofile-confirm", async (req, res) => {
  try {
    const { orderNumber, transactionId } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ success: false, message: "Order number is required." });
    }

    const order = await Order.findOne({ orderNumber: orderNumber.trim() });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (transactionId) {
      order.razorpayPaymentId = transactionId.trim();
    }

    const { emailDispatched } = await grantOrderAccessAndSendEmail(order);

    return res.json({
      success: true,
      message: "SuperProfile payment confirmed! Access granted.",
      orderNumber: order.orderNumber,
      emailDispatched,
      order,
      redirectUrl: `/order-success/${order.orderNumber}`,
    });
  } catch (error) {
    console.error("[SuperProfile] Confirm error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm SuperProfile payment.",
    });
  }
});

// @route   POST /api/payment/superprofile-webhook
// @desc    Optional webhook for SuperProfile to auto-confirm pending orders by email
router.post("/superprofile-webhook", async (req, res) => {
  try {
    const payload = req.body || {};
    const email = (payload.email || payload.customerEmail || payload.buyer_email || "").toLowerCase().trim();
    const orderNumber = payload.orderNumber || payload.referenceId || "";

    let order = null;
    if (orderNumber) {
      order = await Order.findOne({ orderNumber: String(orderNumber).trim() });
    }
    if (!order && email) {
      order = await Order.findOne({ customerEmail: email, paymentStatus: "pending" }).sort({ createdAt: -1 });
    }

    if (!order) {
      return res.status(200).json({ success: true, message: "Webhook received (no matching pending order)." });
    }

    await grantOrderAccessAndSendEmail(order);
    return res.json({ success: true, message: "Order confirmed via SuperProfile webhook.", orderNumber: order.orderNumber });
  } catch (error) {
    console.error("[SuperProfile] Webhook error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
