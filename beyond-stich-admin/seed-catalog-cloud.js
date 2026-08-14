import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing in .env.local');
  process.exit(1);
}

// Target Catalog Directory
const CATALOG_BASE = 'C:\\Users\\starc\\Downloads\\catalogue-beyond-stich';

// Segment Mapping
const FOLDER_SEGMENT_MAP = {
  'men-ten-catalogue': 'TYPOGRAPHY',
  'game-catalogue': 'GAMER',
  'girls-catalogue': 'SUMMER',
};

// Title Generator Helper
function generateTitle(baseName, index, segment) {
  if (baseName.includes('you can be strong')) return 'YOU CAN BE STRONG';
  if (baseName.includes('beilive') || baseName.includes('succeed')) return 'BELIEVE ACHIEVE SUCCEED';
  if (baseName.includes('voice not on echo')) return 'BE A VOICE NOT AN ECHO';

  const adjectives = ['HEAVYWEIGHT', 'OVERSIZED', 'VINTAGE', 'REBEL', 'CORE', 'NEON', 'CYBER', 'APEX', 'STEALTH', 'PRIME'];
  const adj = adjectives[index % adjectives.length];
  
  if (segment === 'GAMER') return `${adj} GAMER EDITION ${index + 1}`;
  if (segment === 'SUMMER') return `${adj} BREEZE DROP ${index + 1}`;
  return `${adj} TYPO DROP ${index + 1}`;
}

// Group images into products
function groupImagesInDirectory(dirPath) {
  const files = fs.readdirSync(dirPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  const groups = {}; // key -> array of filenames

  files.forEach(file => {
    // Check pattern: "1.png", "1 (2).png", "1 (3).png"
    const matchNumber = file.match(/^(\d+)(?:\s*\(\d+\))?\.(png|jpg|jpeg|webp)$/i);
    // Check pattern: "3 - Copy (2).png", "3 - Copy.png", "3.png"
    const matchCopy = file.match(/^(\d+)\s*-\s*Copy/i);

    let key = file;
    if (matchCopy) {
      key = `product_${matchCopy[1]}`;
    } else if (matchNumber) {
      key = `product_${matchNumber[1]}`;
    } else {
      key = `custom_${file.replace(/\.(png|jpg|jpeg|webp)$/i, '')}`;
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(file);
  });

  return groups;
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting Smart SEO Catalog & Image Upload Process...');

  console.log('📡 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const db = mongoose.connection.db;
  const productsCol = db.collection('products');

  if (!fs.existsSync(CATALOG_BASE)) {
    console.error(`❌ Catalog directory not found at ${CATALOG_BASE}`);
    process.exit(1);
  }

  const catalogFolders = fs.readdirSync(CATALOG_BASE).filter(f => fs.statSync(path.join(CATALOG_BASE, f)).isDirectory());

  let totalProductsCreated = 0;

  for (const folderName of catalogFolders) {
    const segment = FOLDER_SEGMENT_MAP[folderName] || 'RANDOMS';
    const folderPath = path.join(CATALOG_BASE, folderName);
    console.log(`\n📂 Processing Folder: [${folderName}] -> Segment: [${segment}]`);

    const imageGroups = groupImagesInDirectory(folderPath);
    const keys = Object.keys(imageGroups);

    console.log(`Found ${keys.length} product image sets in ${folderName}.`);

    let itemIdx = 0;
    for (const key of keys) {
      try {
        itemIdx++;
        const fileList = imageGroups[key];
        // Sort main image first (e.g., 7.png before 7 (2).png)
        fileList.sort((a, b) => a.length - b.length || a.localeCompare(b));

        const rawTitle = generateTitle(key, itemIdx, segment);
        const slug = `${rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${segment.toLowerCase()}-${itemIdx}`.replace(/^-+|-+$/g, '');

        console.log(`\n[${itemIdx}/${keys.length}] Product: "${rawTitle}" (${fileList.length} images)`);

        // Check if product already exists
        const existing = await productsCol.findOne({ slug });
        if (existing) {
          console.log(`  ⏩ Product slug "${slug}" already exists in DB. Skipping upload.`);
          continue;
        }

        // Upload images to Cloudinary
        const uploadedCloudinaryUrls = [];
        for (let imgIdx = 0; imgIdx < fileList.length; imgIdx++) {
          const fileName = fileList[imgIdx];
          const filePath = path.join(folderPath, fileName);
          const seoPublicId = `beyond-stich-${slug}-img${imgIdx + 1}`.substring(0, 100);

          console.log(`  ⬆️ Uploading to Cloudinary: ${fileName} -> ID: ${seoPublicId}`);
          try {
            const res = await cloudinary.uploader.upload(filePath, {
              folder: 'beyond-stich-products',
              public_id: seoPublicId,
              overwrite: true,
              resource_type: 'image',
            });
            uploadedCloudinaryUrls.push(res.secure_url);
          } catch (uploadErr) {
            console.error(`  ❌ Failed to upload ${fileName}:`, uploadErr.message || uploadErr);
          }
        }

        if (uploadedCloudinaryUrls.length === 0) {
          console.warn(`  ⚠️ No images successfully uploaded for ${rawTitle}. Skipping DB insert.`);
          continue;
        }

        // Construct MongoDB Product Record
        const price = 949 + (itemIdx % 4) * 50; // ₹949 - ₹1099
        const mrp = price + 550; // ₹1499 - ₹1649

        const productDoc = {
          name: rawTitle,
          slug,
          segment,
          price,
          mrp,
          images: uploadedCloudinaryUrls,
          sizes: [
            { size: 'S', stock: 15 },
            { size: 'M', stock: 25 },
            { size: 'L', stock: 30 },
            { size: 'XL', stock: 10 },
          ],
          colors: ['Black', 'Off White'],
          description: `Experience luxury heavyweight street fashion with the ${rawTitle} Oversized Heavyweight Graphic Tee. Crafted from 240 GSM 100% French Terry Cotton, engineered for perfect shoulder drape, fade-resistant high-density screen print, and built for maximum comfort and durability.`,
          fitType: 'Oversized',
          material: '240 GSM French Terry Cotton',
          tags: ['featured', 'new-drop', 'oversized', segment.toLowerCase()],
          averageRating: Number((4.5 + ((itemIdx % 5) * 0.1)).toFixed(1)),
          reviewCount: 12 + (itemIdx * 3),
          viewCount: 150 + (itemIdx * 25),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await productsCol.insertOne(productDoc);
        console.log(`  ✅ Successfully created product "${rawTitle}" in MongoDB!`);
        totalProductsCreated++;

        // Small delay between uploads to avoid API rate-limits
        await sleep(300);
      } catch (prodErr) {
        console.error(`  ❌ Error processing key "${key}":`, prodErr.message || prodErr);
      }
    }
  }

  console.log(`\n🎉 Upload Complete! Total ${totalProductsCreated} new products uploaded to Cloudinary & inserted into MongoDB Atlas.`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
