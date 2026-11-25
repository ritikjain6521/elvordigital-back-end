require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");

async function clearData() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("No MongoDB URI provided in .env");
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const ordersResult = await db.collection("orders").deleteMany({});
    console.log(`Deleted orders: ${ordersResult.deletedCount}`);

    const accessResult = await db.collection("accessrecords").deleteMany({});
    console.log(`Deleted access records: ${accessResult.deletedCount}`);

    const productsResult = await db.collection("products").updateMany({}, {
      $set: { totalSales: 0, totalRevenue: 0 }
    });
    console.log(`Reset products sales stats: ${productsResult.modifiedCount}`);

    console.log("SUCCESS: All mock orders, access records, and product sales cleared!");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing data:", err);
    process.exit(1);
  }
}

clearData();
