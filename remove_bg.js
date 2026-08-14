const Jimp = require('jimp');
const path = require('path');

async function removeBackground() {
  const inputPaths = [
    path.join(__dirname, 'beyond-stich-store', 'public', 'logos', 'darktheme-logo-withoutoutline.png'),
  ];
  
  const outputPathStore = path.join(__dirname, 'beyond-stich-store', 'public', 'logos', 'darktheme-logo-transparent.png');
  const outputPathAdmin = path.join(__dirname, 'beyond-stich-admin', 'public', 'logos', 'darktheme-logo-transparent.png');

  for (const inputPath of inputPaths) {
    try {
      const image = await Jimp.read(inputPath);
      // Get the color of the top-left pixel to use as the background color to remove
      const bgColor = image.getPixelColor(0, 0);
      const bgRgba = Jimp.intToRGBA(bgColor);

      const tolerance = 15; // Color tolerance

      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const a = this.bitmap.data[idx + 3];

        // Check if the current pixel is similar to the background color
        if (
          Math.abs(r - bgRgba.r) <= tolerance &&
          Math.abs(g - bgRgba.g) <= tolerance &&
          Math.abs(b - bgRgba.b) <= tolerance
        ) {
          // Make it fully transparent
          this.bitmap.data[idx + 3] = 0;
        }
      });

      await image.writeAsync(outputPathStore);
      await image.writeAsync(outputPathAdmin);
      console.log('Background removed successfully and saved as darktheme-logo-transparent.png');
    } catch (err) {
      console.error('Error processing image:', err);
    }
  }
}

removeBackground();
