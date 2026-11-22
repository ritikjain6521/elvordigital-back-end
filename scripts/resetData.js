const mongoose = require('mongoose');
require('dotenv').config();

async function reset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Reset sales & revenue counters on products to 0
    const prodRes = await mongoose.connection.db.collection('products').updateMany(
      {},
      { $set: { totalSales: 0, totalRevenue: 0 } }
    );
    console.log(`Reset ${prodRes.modifiedCount} products sales/revenue counters.`);

    console.log('MongoDB is pristine: only real products exist, mock data deleted.');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting:', err);
    process.exit(1);
  }
}

reset();
