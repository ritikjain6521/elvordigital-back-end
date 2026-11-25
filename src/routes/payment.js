const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AccessRecord = require("../models/AccessRecord");
const DigitalAsset = require("../models/DigitalAsset");
const { sendProductAccessEmail } = require("../services/emailService");

const router = express.Router();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_U3IdhaFcjzNry8";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "cK0Y4fUyFZC25FxwF6jV9icJ";
  return new Razorpay({ key_id, key_secret });
};

// @route   GET /api/payment/config
// @desc    Get Razorpay public key ID
router.get("/config", (req, res) => {
  return res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID || "rzp_test_U3IdhaFcjzNry8",
  });
});

// @route   POST /api/payment/create-order
// @desc    Initialize official Razorpay order and register pending order in MongoDB
router.post("/create-order", async (req, res) => {
  try {
    const {
      amount,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      discount,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid order amount is required." });
    }

    const razorpay = getRazorpayInstance();
    const orderNumber = `ELV-${Math.floor(1000 + Math.random() * 9000)}`;

    // Razorpay amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: orderNumber,
      notes: {
        customerEmail: customerEmail || "customer@example.com",
        customerName: customerName || "Valued Customer",
      },
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Enrich items with EXACT links from Digital Asset Vault / Product in MongoDB
    const enrichedItems = await Promise.all(
      (items || []).map(async (item) => {
        let prod = null;
        let digitalAsset = null;

        try {
          // 1. Look up product
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

          // 2. Robust Look up of Digital Asset Vault entry for this product
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

        const itemSlug = prod?.slug || (item.productId || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

        // Direct Download URL strictly from Product Delivery Files or Digital Asset Vault
        let directFileDownload = "";
        const prodDownload = prod?.downloadFileUrl?.trim() || "";
        const assetDownload = digitalAsset?.fileUrl?.trim() || "";
        const itemDownload = item?.downloadFileUrl?.trim() || "";

        const resolveDirectDownloadUrl = (url) => {
          if (!url || typeof url !== "string") return "";
          const trimmed = url.trim();
          if (!trimmed) return "";
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
          const backendBase = process.env.BACKEND_URL || "https://elvordigital-back-end.onrender.com";
          return `${backendBase.replace(/\/+$/, "")}/${trimmed.replace(/^\/+/, "")}`;
        };

        if (
          prodDownload &&
          !prodDownload.includes("assets.ElvorDigital.com") &&
          !prodDownload.includes("/api/download/")
        ) {
          directFileDownload = resolveDirectDownloadUrl(prodDownload);
        } else if (
          assetDownload &&
          !assetDownload.includes("assets.ElvorDigital.com") &&
          !assetDownload.includes("/api/download/")
        ) {
          directFileDownload = resolveDirectDownloadUrl(assetDownload);
        } else if (
          itemDownload &&
          !itemDownload.includes("assets.ElvorDigital.com") &&
          !itemDownload.includes("/api/download/")
        ) {
          directFileDownload = resolveDirectDownloadUrl(itemDownload);
        }

        // Exact Google Drive Link (strictly from Product or Digital Asset Vault)
        let googleDriveLink =
          (prod && prod.googleDriveLink && prod.googleDriveLink.trim()) ||
          (digitalAsset && digitalAsset.googleDriveLink && digitalAsset.googleDriveLink.trim()) ||
          (item.googleDriveLink && item.googleDriveLink.trim()) ||
          "";

        if (googleDriveLink.includes("1ElvorDigital") || googleDriveLink.includes("1EXAMPLE_REAL")) {
          googleDriveLink = "";
        }

        // Exact Cloud Resource Folder Link (strictly from Product or Digital Asset Vault)
        let accessFolderLink =
          (prod && prod.accessFolderLink && prod.accessFolderLink.trim()) ||
          (digitalAsset && digitalAsset.accessFolderLink && digitalAsset.accessFolderLink.trim()) ||
          (item.accessFolderLink && item.accessFolderLink.trim()) ||
          "";

        if (accessFolderLink.includes("cloud.ElvorDigital.com")) {
          accessFolderLink = "";
        }

        // Exact Video Lesson Link (strictly from Product or Digital Asset Vault)
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

    // Save pending order in MongoDB Atlas
    const newOrder = new Order({
      orderNumber,
      customerName: customerName || "Customer",
      customerEmail: (customerEmail || "").toLowerCase().trim(),
      customerPhone: customerPhone || "",
      items: enrichedItems,
      subtotal: Number(subtotal || amount),
      discount: Number(discount || 0),
      totalAmount: Number(amount),
      paymentStatus: "pending",
      paymentMethod: "RAZORPAY",
      accessStatus: "pending",
      couponUsed: req.body.couponUsed || "",
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderNumber,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_U3IdhaFcjzNry8",
    });
  } catch (error) {
    console.error("[Razorpay] Create order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize Razorpay checkout order.",
    });
  }
});

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment signature, grant access in MongoDB, and dispatch live email
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderNumber,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment verification parameters.",
      });
    }

    // Verify HMAC SHA256 Signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "cK0Y4fUyFZC25FxwF6jV9icJ";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isMatch = generated_signature === razorpay_signature;

    if (!isMatch) {
      console.error("[Razorpay] Invalid cryptographic signature:", {
        generated: generated_signature,
        received: razorpay_signature,
      });
      return res.status(400).json({
        success: false,
        message: "Payment signature mismatch. Transaction verification failed.",
      });
    }

    console.log(`[Razorpay] Payment verified successfully for Payment ID: ${razorpay_payment_id}`);

    // Update order status in MongoDB
    let order = null;
    if (orderNumber) {
      order = await Order.findOne({ orderNumber: orderNumber.trim() });
    }

    if (!order) {
      order = await Order.findOne().sort({ createdAt: -1 });
    }

    if (order) {
      order.paymentStatus = "paid";
      order.accessStatus = "granted";
      order.paymentMethod = "RAZORPAY";
      await order.save();

      // Create AccessRecord in MongoDB
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

        // Increment sales stats
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
        } catch (e) {
          // Non-blocking stats
        }
      }

      // Dispatch live email with exact links configured in Digital Asset Vault (with 8s safety timeout)
      const emailResult = await Promise.race([
        sendProductAccessEmail({
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          items: order.items,
          totalAmount: order.totalAmount,
        }),
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: false, error: "Email dispatch timed out (handled by frontend relay)" }), 8000)
        ),
      ]);

      if (emailResult.success) {
        order.emailSent = true;
        order.emailSentAt = new Date();
        await order.save();
      }
    }

    return res.json({
      success: true,
      message: "Razorpay payment verified successfully! Access granted.",
      orderNumber: order?.orderNumber || orderNumber,
      order: order,
      redirectUrl: `/order-success/${order?.orderNumber || orderNumber}`,
    });
  } catch (error) {
    console.error("[Razorpay] Verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify Razorpay payment.",
    });
  }
});

module.exports = router;
