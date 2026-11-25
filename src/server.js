require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Import Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const orderRoutes = require("./routes/orders");
const accessRoutes = require("./routes/access");
const emailRoutes = require("./routes/email");
const assetRoutes = require("./routes/assets");
const downloadRoutes = require("./routes/download");
const paymentRoutes = require("./routes/payment");
const analyticsRoutes = require("./routes/analytics");

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  "https://elvordigital-front-end.vercel.app",
  "https://ElvorDigital-front-end.vercel.app",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static uploads folder
const uploadsDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", analyticsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ElvorDigital Backend API",
    version: "2.3-https-relay",
    nodeVersion: process.version,
    isRender: Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID),
    mongodb: "Connected",
    timestamp: new Date().toISOString(),
  });
});

// Run Auto-Seeding helper
const seedDefaultData = require("./scripts/seedHelper");
seedDefaultData();

app.listen(PORT, () => {
  console.log(`[ElvorDigital Backend] Server listening on http://localhost:${PORT}`);
});
