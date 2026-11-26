const dns = require("dns");
const mongoose = require("mongoose");

// Ensure SRV lookups succeed on networks/Windows DNS where local resolver refuses querySrv
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if not supported
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Do not exit, keep attempting or allow fallback
  }
};

module.exports = connectDB;
