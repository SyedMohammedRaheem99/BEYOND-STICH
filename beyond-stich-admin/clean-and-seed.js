/**
 * clean-and-seed.js
 * Step 1: Delete ALL existing products from MongoDB Atlas
 * Step 2: Upload all 4 images per product to Cloudinary with proper SEO IDs
 * Step 3: Insert 35 clean product documents into MongoDB Atlas
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGODB_URI = process.env.MONGODB_URI;

// Valid segments from the Product schema
const SEGMENT_MAP = {
  'Premium-products-catalogue': 'TYPOGRAPHY',
  'floral-proper-catalogue': 'FLORAL',
  'gamer-proper-catalogue': 'GAMER',
};

// Read product name from folder name and convert to human-readable title
// e.g. "Believe-Achieve-Black-Oversized-Tee" -> "BELIEVE ACHIEVE BLACK OVERSIZED TEE"
function folderToTitle(folderName) {
  return folderName.replace(/-/g, ' ').toUpperCase();
}

// Convert folder name to a clean URL slug
// e.g. "Believe-Achieve-Black-Oversized-Tee" -> "believe-achieve-black-oversized-tee"
function folderToSlug(folderName) {
  return folderName.toLowerCase();
}

// Extract color from folder name: if contains 'White', color is White, else Black
function extractColor(folderName) {
  if (/white/i.test(folderName)) return ['White'];
  return ['Black'];
}

// Extract price from item index (rotate between price tiers)
function getPrice(idx) {
  const prices = [949, 999, 1049, 1099];
  return prices[idx % prices.length];
}

// Sort images: Front-Hero first, then Design-Closeup, Neckline-Detail, Sleeve-Detail
function sortImages(files) {
  const order = ['Front-Hero', 'Design-Closeup', 'Neckline-Detail', 'Sleeve-Detail'];
  return files.sort((a, b) => {
    const ai = order.findIndex(k => a.includes(k));
    const bi = order.findIndex(k => b.includes(k));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('\n📡 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const col = db.collection('products');
  console.log('✅ Connected.\n');

  // ── STEP 1: FULL DELETE of all existing products ────────────────────────────
  console.log('🗑️  Deleting ALL existing products from MongoDB Atlas...');
  const deleteResult = await col.deleteMany({});
  console.log(`✅ Deleted ${deleteResult.deletedCount} products from the database.\n`);

  // ── STEP 2 & 3: Upload images & insert proper products ─────────────────────
  const CATALOG_ROOT = 'C:\\Users\\starc\\Downloads\\catalogue-beyond-stich\\catalogue-proper-products';
  const subCatalogues = fs.readdirSync(CATALOG_ROOT).filter(f =>
    fs.statSync(path.join(CATALOG_ROOT, f)).isDirectory()
  );

  let totalProductsAdded = 0;
  let globalIdx = 0;

  for (const subCatalogue of subCatalogues) {
    const segment = SEGMENT_MAP[subCatalogue] || 'TYPOGRAPHY';
    const subPath = path.join(CATALOG_ROOT, subCatalogue);

    const productFolders = fs.readdirSync(subPath).filter(f =>
      fs.statSync(path.join(subPath, f)).isDirectory()
    );

    console.log(`\n📂 [${subCatalogue}] → Segment: ${segment} | ${productFolders.length} products`);
    console.log('─'.repeat(60));

    for (const productFolder of productFolders) {
      globalIdx++;
      const productPath = path.join(subPath, productFolder);
      const title = folderToTitle(productFolder);
      const slug = folderToSlug(productFolder);
      const colors = extractColor(productFolder);
      const price = getPrice(globalIdx);
      const mrp = price + 550;

      console.log(`\n[${globalIdx}] ${title}`);

      // Get all image files inside the product folder, sort them correctly
      const rawFiles = fs.readdirSync(productPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
      const sortedFiles = sortImages([...rawFiles]);

      // Upload each image to Cloudinary
      const uploadedUrls = [];
      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        const filePath = path.join(productPath, file);
        // Build a clean SEO public_id like: beyond-stich/believe-achieve-black/front-hero
        const imgLabel = file.replace(`${productFolder}-`, '').replace(/\.(png|jpg|jpeg|webp)$/i, '').toLowerCase();
        const publicId = `beyond-stich-products/${slug}/${imgLabel}`;

        try {
          const res = await cloudinary.uploader.upload(filePath, {
            folder: 'beyond-stich-products',
            public_id: `${slug}-${imgLabel}`,
            overwrite: true,
            resource_type: 'image',
          });
          uploadedUrls.push(res.secure_url);
          console.log(`  ✅ [${i + 1}/${sortedFiles.length}] Uploaded: ${imgLabel}`);
        } catch (err) {
          console.error(`  ❌ Failed to upload ${file}:`, err.message || err);
        }

        await sleep(200); // slight delay to avoid rate limits
      }

      if (uploadedUrls.length === 0) {
        console.warn(`  ⚠️  No images uploaded for "${title}". Skipping.`);
        continue;
      }

      // Build product document matching the Product schema exactly
      const productDoc = {
        name: title,
        slug,
        segment,
        price,
        mrp,
        images: uploadedUrls,
        sizes: [
          { size: 'S', stock: 20 },
          { size: 'M', stock: 35 },
          { size: 'L', stock: 30 },
          { size: 'XL', stock: 15 },
        ],
        colors,
        description:
          `The ${title} is a premium 240 GSM 100% French Terry Cotton oversized heavyweight tee. ` +
          `Engineered for a relaxed, structured fit with drop shoulders, fade-resistant screen print, and premium durable stitching. ` +
          `Machine washable. Made for those who wear their thoughts.`,
        fitType: 'Oversized',
        material: '240 GSM French Terry Cotton',
        tags: ['new-drop', 'featured', 'oversized', segment.toLowerCase(), ...colors.map(c => c.toLowerCase())],
        averageRating: parseFloat((4.5 + (globalIdx % 6) * 0.1).toFixed(1)),
        reviewCount: 5 + globalIdx * 4,
        viewCount: 100 + globalIdx * 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await col.insertOne(productDoc);
        console.log(`  ✅ Inserted "${title}" into MongoDB Atlas.`);
        totalProductsAdded++;
      } catch (err) {
        if (err.code === 11000) {
          console.warn(`  ⚠️  Slug "${slug}" already exists. Skipping duplicate.`);
        } else {
          console.error(`  ❌ DB insert failed for "${title}":`, err.message);
        }
      }
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎉 DONE! ${totalProductsAdded} proper products seeded into MongoDB Atlas.`);
  console.log(`${'═'.repeat(60)}\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
