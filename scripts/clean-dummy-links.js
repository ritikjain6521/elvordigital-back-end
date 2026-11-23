const mongoose = require("mongoose");
require("dotenv").config();

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clean dummy cloud.zenovavibe.com links
  const res1 = await mongoose.connection.db.collection("products").updateMany(
    { accessFolderLink: { $regex: "cloud\\.zenovavibe\\.com" } },
    { $set: { accessFolderLink: "" } }
  );

  // Clean dummy 1zenovavibe or 1EXAMPLE Google Drive links
  const res2 = await mongoose.connection.db.collection("products").updateMany(
    {
      $or: [
        { googleDriveLink: { $regex: "1zenovavibe" } },
        { googleDriveLink: { $regex: "1EXAMPLE" } },
      ],
    },
    { $set: { googleDriveLink: "" } }
  );

  // Sync with real DigitalAssets in DB
  const assets = await mongoose.connection.db.collection("digitalassets").find({ status: "active" }).toArray();
  for (const asset of assets) {
    if (asset.googleDriveLink || asset.accessFolderLink || asset.fileUrl) {
      const update = {};
      if (asset.googleDriveLink && !asset.googleDriveLink.includes("1EXAMPLE")) {
        update.googleDriveLink = asset.googleDriveLink.trim();
      }
      if (asset.accessFolderLink && !asset.accessFolderLink.includes("cloud.zenovavibe.com")) {
        update.accessFolderLink = asset.accessFolderLink.trim();
      }
      if (asset.fileUrl) {
        update.downloadFileUrl = asset.fileUrl.trim();
      }
      if (Object.keys(update).length > 0) {
        if (asset.associatedProductId && /^[0-9a-fA-F]{24}$/.test(asset.associatedProductId)) {
          await mongoose.connection.db.collection("products").updateOne(
            { _id: new mongoose.Types.ObjectId(asset.associatedProductId) },
            { $set: update }
          );
        } else if (asset.associatedProductName) {
          await mongoose.connection.db.collection("products").updateOne(
            { name: asset.associatedProductName.trim() },
            { $set: update }
          );
        }
      }
    }
  }

  console.log(`Cleaned dummy access links: ${res1.modifiedCount}, dummy drive links: ${res2.modifiedCount}`);
  const prods = await mongoose.connection.db.collection("products").find({}, { projection: { name: 1, googleDriveLink: 1, accessFolderLink: 1 } }).toArray();
  console.log("Updated products links in MongoDB:", prods);
  process.exit(0);
}

clean().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
