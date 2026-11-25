const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AccessRecord = require("../models/AccessRecord");
const DigitalAsset = require("../models/DigitalAsset");
const { sendProductAccessEmail } = require("../services/emailService");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order and provision access upon confirmed payment
// @access  Public
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      discount,
      totalAmount,
      paymentMethod,
      couponUsed,
      simulatePaymentSuccess = true, // default true for store checkout
    } = req.body;

    if (!customerEmail || !items || !items.length) {
      return res.status(400).json({ success: false, message: "Customer email and items are required." });
    }

    const orderNumber = `ELV-${Math.floor(1000 + Math.random() * 9000)}`;

    // Enrich items with product details and access links from Digital Asset Vault
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
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
          console.warn("[Orders] Product lookup warning:", e.message);
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

    const paymentStatus = simulatePaymentSuccess ? "paid" : "pending";
    const accessStatus = paymentStatus === "paid" ? "granted" : "pending";

    const newOrder = new Order({
      orderNumber,
      customerName: customerName || "Customer",
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone || "",
      items: enrichedItems,
      subtotal: Number(subtotal || totalAmount),
      discount: Number(discount || 0),
      totalAmount: Number(totalAmount),
      paymentStatus,
      paymentMethod: paymentMethod || "UPI",
      accessStatus,
      couponUsed: couponUsed || "",
    });

    const savedOrder = await newOrder.save();

    // Point 5: If paid, generate access records and send real-time email
    if (paymentStatus === "paid") {
      // Create AccessRecord for each product
      for (const item of enrichedItems) {
        await AccessRecord.create({
          customerEmail: savedOrder.customerEmail,
          customerName: savedOrder.customerName,
          productId: item.productId,
          productName: item.productName,
          orderId: savedOrder.orderNumber,
          googleDriveLink: item.googleDriveLink,
          accessFolderLink: item.accessFolderLink,
          downloadFileUrl: item.downloadFileUrl,
          status: "active",
        });

        // Update product sales stats
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
        } catch (statsErr) {
          console.warn("[Orders] Stats update warning:", statsErr.message);
        }
      }

      // Dispatch real email with Google Drive link & access resources
      const emailResult = await sendProductAccessEmail({
        customerEmail: savedOrder.customerEmail,
        customerName: savedOrder.customerName,
        orderNumber: savedOrder.orderNumber,
        items: enrichedItems,
        totalAmount: savedOrder.totalAmount,
      });

      if (emailResult.success) {
        savedOrder.emailSent = true;
        savedOrder.emailSentAt = new Date();
        await savedOrder.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: "Order processed successfully.",
      order: savedOrder,
      redirectUrl: `/order-success/${savedOrder.orderNumber}`,
    });
  } catch (error) {
    console.error("[Orders] Create error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process order." });
  }
});

// @route   GET /api/orders/my?email=customer@email.com
// @desc    Get all PAID orders by customer email (for My Library page)
// @access  Public (email is the lookup key)
router.get("/my", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    const orders = await Order.find({
      customerEmail: email.toLowerCase().trim(),
      paymentStatus: "paid",
    }).sort({ createdAt: -1 });

    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("[Orders] My Library fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve orders." });
  }
});

// @route   GET /api/orders/:idOrNumber
// @desc    Get order details (for Order Success page or admin inspection)
router.get("/:idOrNumber", async (req, res) => {
  try {
    const { idOrNumber } = req.params;
    let order;

    if (idOrNumber.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(idOrNumber);
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: idOrNumber.toUpperCase() });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error("[Orders] Fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve order." });
  }
});

// @route   GET /api/orders
// @desc    List all orders
// @access  Private (Admin)
router.get("/", protectAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("[Orders] Admin fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve orders." });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order payment/access status
// @access  Private (Admin)
router.put("/:id/status", protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    order.paymentStatus = paymentStatus;
    if (paymentStatus === "paid" && order.accessStatus !== "granted") {
      order.accessStatus = "granted";
      // Ensure access records exist
      for (const item of order.items) {
        await AccessRecord.findOneAndUpdate(
          { orderId: order.orderNumber, productId: item.productId },
          { status: "active" },
          { upsert: true, new: true }
        );
      }
      // Send access email
      await sendProductAccessEmail({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
      });
      order.emailSent = true;
    } else if (paymentStatus === "refunded") {
      order.accessStatus = "revoked";
      await AccessRecord.updateMany({ orderId: order.orderNumber }, { status: "revoked" });
    }

    await order.save();
    return res.json({ success: true, message: "Order updated.", order });
  } catch (error) {
    console.error("[Orders] Status update error:", error);
    return res.status(500).json({ success: false, message: "Failed to update order status." });
  }
});

module.exports = router;
