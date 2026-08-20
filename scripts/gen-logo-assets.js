// Regenerates brand assets from the 6250px masters in assets-logo/.
// Run: node gen_logo_assets.js
const sharp = require('../beyond-stich-store/node_modules/sharp');
const path = require('path');

const STORE = path.join(__dirname, '..', 'beyond-stich-store');
const WORDMARK = path.join(__dirname, '..', 'assets-logo', 'beyond-stich-logo (1).png');
const BADGE = path.join(__dirname, '..', 'assets-logo', 'darktheme-logo-with-circle.png');

const p = (...s) => path.join(STORE, ...s);

async function main() {
  // --- Navbar / footer wordmark -------------------------------------------
  // Rendered at 84px tall on desktop, 44px on mobile. We ship 3x the largest
  // (252px) so it stays sharp on retina without shipping the 6250px master.
  const wm = sharp(WORDMARK).trim();
  const { width, height } = await wm.toBuffer({ resolveWithObject: true }).then(r => r.info);
  const ratio = width / height;

  for (const h of [84, 168, 252]) {
    const suffix = h === 84 ? '' : `@${h / 84}x`;
    await sharp(WORDMARK).trim()
      .resize({ height: h, width: Math.round(h * ratio), fit: 'inside' })
      .png({ compressionLevel: 9, palette: true })
      .toFile(p('public', 'logos', `wordmark${suffix}.png`));
  }
  // WebP for modern browsers (next/image will prefer it)
  await sharp(WORDMARK).trim()
    .resize({ height: 252, width: Math.round(252 * ratio), fit: 'inside' })
    .webp({ quality: 92 })
    .toFile(p('public', 'logos', 'wordmark.webp'));

  console.log(`wordmark: source ${width}x${height} (ratio ${ratio.toFixed(3)}) -> 84/168/252px`);

  // --- Favicons / app icons ------------------------------------------------
  // The old icon.png and apple-icon.png were the raw 6250x6250 master at
  // 3.8MB each, downloaded on every page load to draw a 32px tab icon.
  const badge = () => sharp(BADGE).trim();

  await badge().resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 }).toFile(p('src', 'app', 'icon.png'));

  // Apple touch icons are composited on white if transparent, so flatten to
  // the brand black deliberately rather than letting iOS choose.
  await badge().resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: '#0A0A0A' })
    .png({ compressionLevel: 9 }).toFile(p('src', 'app', 'apple-icon.png'));

  await badge().resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 }).toFile(p('public', 'logos', 'icon-192.png'));
  await badge().resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 }).toFile(p('public', 'logos', 'icon-512.png'));

  // --- Watermark (Phase 2 uses this behind product grids) ------------------
  // Uses the circle-less wordmark: the badge version is a filled black disc,
  // which reads as a dark blob rather than a watermark when laid at ~6%
  // opacity over the near-black page background.
  const MARK = path.join(__dirname, '..', 'assets-logo', 'logo-withoutcircle.png');
  const mi = await sharp(MARK).trim().toBuffer({ resolveWithObject: true });
  const mr = mi.info.width / mi.info.height;
  await sharp(MARK).trim().resize({ width: 1400, height: Math.round(1400 / mr), fit: 'inside' })
    .png({ compressionLevel: 9, palette: true, colors: 64 })
    .toFile(p('public', 'logos', 'watermark.png'));
  await sharp(MARK).trim().resize({ width: 1400, height: Math.round(1400 / mr), fit: 'inside' })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(p('public', 'logos', 'watermark.webp'));

  console.log('icons: 512 (icon.png), 180 (apple), 192/512 (pwa), 1200 (watermark)');
}

main().catch(e => { console.error(e); process.exit(1); });
