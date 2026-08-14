const Jimp = require('jimp');
const path = require('path');

async function processLogo() {
  const inputPath = path.join(__dirname, 'assets-logo', 'beyond-stich-logo (1).png');
  
  console.log('Reading logo...');
  const image = await Jimp.read(inputPath);
  console.log(`Original size: ${image.bitmap.width}x${image.bitmap.height}`);

  // Step 1: Remove the white/near-white background
  // The logo has light cream text on a white background
  // We need to make the white BG transparent while keeping the cream/off-white text
  const tolerance = 12; // tight tolerance to only strip pure white
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // Pure white or very near-white background pixels (RGB all > 250)
    if (r >= 250 && g >= 250 && b >= 250) {
      this.bitmap.data[idx + 3] = 0; // fully transparent
    }
  });

  // Step 2: Auto-crop (trim transparent padding)
  image.autocrop({ tolerance: 0.002, cropOnlyFrames: false });
  console.log(`After crop: ${image.bitmap.width}x${image.bitmap.height}`);

  // Step 3: Invert the colors so the logo becomes bright white 
  // (currently it's cream/off-white which is hard to see on dark backgrounds)
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const a = this.bitmap.data[idx + 3];
    if (a > 0) {
      // Make non-transparent pixels pure white for maximum contrast on dark bg
      this.bitmap.data[idx + 0] = 255; // R
      this.bitmap.data[idx + 1] = 255; // G
      this.bitmap.data[idx + 2] = 255; // B
    }
  });

  // Step 4: Save at a high-res web-optimized size (800px wide)
  const targetWidth = 800;
  image.resize(targetWidth, Jimp.AUTO, Jimp.RESIZE_BICUBIC);
  console.log(`Final size: ${image.bitmap.width}x${image.bitmap.height}`);

  // Save to both apps
  const storeOut = path.join(__dirname, 'beyond-stich-store', 'public', 'logos', 'brand-logo.png');
  const adminOut = path.join(__dirname, 'beyond-stich-admin', 'public', 'logos', 'brand-logo.png');

  await image.writeAsync(storeOut);
  console.log(`Saved to: ${storeOut}`);
  await image.writeAsync(adminOut);
  console.log(`Saved to: ${adminOut}`);

  console.log('\nDone! Logo processed successfully.');
}

processLogo().catch(err => console.error('Error:', err));
