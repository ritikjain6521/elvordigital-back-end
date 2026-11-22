const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Category = require("../models/Category");
const AccessRecord = require("../models/AccessRecord");

const router = express.Router();

// @route   GET /api/admin/metrics
// @desc    Get live real-time metrics, revenue, orders, and stats directly from MongoDB
// @access  Admin
router.get("/metrics", async (req, res) => {
  try {
    // 1. Total Revenue from paid orders
    const paidOrders = await Order.find({ paymentStatus: "paid" });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalOrdersCount = await Order.countDocuments();
    const paidOrdersCount = paidOrders.length;

    // 2. Total Customers (distinct emails)
    const distinctEmails = await Order.distinct("customerEmail");
    const totalCustomersCount = distinctEmails.length;

    // 3. Products Count
    const totalProductsCount = await Product.countDocuments();
    const activeProductsCount = await Product.countDocuments({ status: "published" });

    // 4. Access Records Count
    const totalAccessRecords = await AccessRecord.countDocuments();

    // 5. Recent 10 Orders
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);

    // 6. Category breakdown from live database
    const categories = await Category.find();
    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat.slug });
        return {
          name: cat.name,
          slug: cat.slug,
          productCount,
        };
      })
    );

    // 7. Calculate real-time daily revenue trend (last 7 entries)
    const revenueByDay = {};
    paidOrders.forEach((o) => {
      const dateStr = o.createdAt
        ? new Date(o.createdAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + Number(o.totalAmount || 0);
    });

    const revenueTrends = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        paidOrders: paidOrdersCount,
        totalCustomers: totalCustomersCount,
        totalProducts: totalProductsCount,
        activeProducts: activeProductsCount,
        totalAccessGranted: totalAccessRecords,
        averageOrderValue: paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0,
      },
      recentOrders,
      categoryStats,
      revenueTrends,
    });
  } catch (error) {
    console.error("[Analytics] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to calculate analytics." });
  }
});

// @route   GET /api/admin/customers
// @desc    Get real-time customer list aggregated from MongoDB
router.get("/customers", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const customerMap = new Map();

    orders.forEach((o) => {
      const email = o.customerEmail;
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: `cust-${customerMap.size + 1}`,
          name: o.customerName || "Customer",
          email: o.customerEmail,
          phone: o.customerPhone || "N/A",
          totalSpent: 0,
          ordersCount: 0,
          lastOrderDate: o.createdAt,
          status: "active",
        });
      }
      const existing = customerMap.get(email);
      existing.ordersCount += 1;
      if (o.paymentStatus === "paid") {
        existing.totalSpent += Number(o.totalAmount || 0);
      }
    });

    const customers = Array.from(customerMap.values());
    return res.json({ success: true, count: customers.length, customers });
  } catch (error) {
    console.error("[Customers] Fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customers." });
  }
});

module.exports = router;
