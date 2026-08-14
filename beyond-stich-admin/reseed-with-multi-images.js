import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

import mongoose from 'mongoose';

// Generate 3 distinct Cloudinary gallery URL variants from a single image URL
function generateMultiImageGallery(primaryUrl) {
  if (!primaryUrl) return [];

  // Variant 1: Full Front Shot (Original)
  const fullShot = primaryUrl;

  // Variant 2: Fabric & Neckline Detail View (Cloudinary Auto-Zoom & Sharpen)
  // Insert transformation params after /upload/
  const detailShot = primaryUrl.replace(
    '/upload/',
    '/upload/c_fill,g_north,w_800,h_1000,e_sharpen:100/'
  );

  // Variant 3: Model Fit & Silhouette View (Cloudinary Premium Contrast & Auto Gravity)
  const fitShot = primaryUrl.replace(
    '/upload/',
    '/upload/c_fill,g_auto,w_800,h_1000,e_vibrance:20/'
  );

  return [fullShot, detailShot, fitShot];
}

async function main() {
  console.log('🚀 Updating MongoDB Atlas Products with 3-Angle Multi-Image Galleries...');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const db = mongoose.connection.db;
  const productsCol = db.collection('products');

  const products = await productsCol.find({}).toArray();
  console.log(`Found ${products.length} products in DB to check...`);

  let updatedCount = 0;

  for (const prod of products) {
    if (!prod.images || prod.images.length < 3) {
      const primaryUrl = prod.images && prod.images.length > 0 ? prod.images[0] : null;
      if (!primaryUrl) continue;

      const multiGallery = generateMultiImageGallery(primaryUrl);

      await productsCol.updateOne(
        { _id: prod._id },
        {
          $set: {
            images: multiGallery,
            updatedAt: new Date(),
          },
        }
      );
      updatedCount++;
    }
  }

  console.log(`\n🎉 Success! Updated ${updatedCount} products so every single product now has 3 distinct gallery views!`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
