/**
 * Seed the current hard-coded banners into the Banner collection.
 *
 *   node scripts/seed-banners.mjs         # write them
 *   node scripts/seed-banners.mjs --dry   # show them, change nothing
 *
 * Until this runs, HeroSection and ShopBanner fall back to the constants in
 * src/lib/banners.js — the site looks right but the copy is only editable by
 * editing code. After it runs the same slides come from the database and the
 * owner can change them in Admin → Banners.
 *
 * The copy, images, codes and accents below are lifted verbatim from
 * HERO_SLIDES, SHOP_BANNERS and ShopBanner's IMAGES map, so seeding changes
 * nothing visible. That is the point: the switch to admin-managed banners
 * should be invisible to a customer.
 *
 * Image paths stay as /banners/... files in public/ rather than Cloudinary
 * URLs. They are already optimised .webp with separate desktop and mobile
 * crops, and re-uploading them would only add a redirect. Anything the owner
 * uploads from the admin from now on lands in Cloudinary.
 *
 * Safe to re-run: rows are matched on `name` and only inserted, never
 * overwritten, so anything edited or switched off in the admin survives.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { existsSync } from 'node:fs';
import dns from 'node:dns';
import mongoose from 'mongoose';

// Same workaround as src/lib/mongodb.js: many home and office routers refuse
// the SRV lookup a mongodb+srv:// string needs, so the default resolver
// fails with ECONNREFUSED while the host is perfectly reachable.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Older runtimes may refuse; the default resolver might still work.
}

const root = path.resolve(import.meta.dirname, '..');

try {
  const raw = readFileSync(path.join(root, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  console.error('Could not read .env.local\n');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry');

// Mirrors HERO_SLIDES in src/lib/banners.js.
const HOME = [
  {
    name: 'Welcome offer',
    desktopImage: '/banners/hero/home-4-desktop.webp',
    mobileImage: '/banners/hero/home-4-mobile.webp',
    badge: 'FIRST ORDER OFFER',
    headline: 'UP TO 25%\nOFF YOUR\nFIRST ORDER',
    subheadline:
      '10% off above ₹949 · 25% off above ₹1999. Free shipping over ₹999, Cash on Delivery, 7-day returns.',
    ctaLabel: 'CLAIM YOUR DISCOUNT',
    ctaHref: '/shop',
    code: 'WELCOME25',
  },
  {
    name: 'Be a voice',
    desktopImage: '/banners/hero/home-3-desktop.webp',
    mobileImage: '/banners/hero/home-3-mobile.webp',
    badge: 'NEW DROP',
    headline: 'BE A VOICE\nNOT AN ECHO',
    subheadline: 'Heavyweight 240 GSM oversized tees from ₹949. Cash on Delivery available.',
    ctaLabel: 'SHOP FROM ₹949',
    ctaHref: '/shop',
  },
  {
    name: 'Pick 2, save more',
    desktopImage: '/banners/hero/home-2-desktop.webp',
    mobileImage: '/banners/hero/home-2-mobile.webp',
    badge: 'BUY 2, SAVE MORE',
    headline: 'PICK 2.\nGET 25% OFF.',
    subheadline:
      'Two tees clear ₹1999 — that unlocks the biggest welcome discount. 13 worlds to choose from.',
    ctaLabel: 'BUILD YOUR SET',
    ctaHref: '/shop',
  },
  {
    name: 'The Explorer tee',
    desktopImage: '/banners/hero/home-1-desktop.webp',
    mobileImage: '/banners/hero/home-1-mobile.webp',
    badge: 'JUST LANDED',
    headline: 'THE EXPLORER\nTEE',
    subheadline: 'Prints that survive the wash, not just the photo. Try it — 7-day free returns.',
    ctaLabel: 'SHOP THE DROP',
    ctaHref: '/shop',
  },
];

// Mirrors SHOP_BANNERS plus the IMAGES map in ShopBanner.jsx, which kept the
// art in a second object keyed by id. A row carries both.
const SHOP = [
  {
    name: 'First order, save 25%',
    desktopImage: '/banners/hero/home-2-desktop.webp',
    mobileImage: '/banners/hero/home-2-mobile.webp',
    headline: 'FIRST ORDER? SAVE 25%',
    subheadline: '10% off above ₹949, 25% off above ₹1999. Applied at checkout.',
    ctaLabel: 'SHOP NOW',
    ctaHref: '/shop',
    accent: '#F5C518',
    code: 'WELCOME25',
  },
  {
    name: 'Starting at ₹949',
    desktopImage: '/banners/shop/drops-2-desktop.webp',
    mobileImage: '/banners/shop/drops-2-mobile.webp',
    headline: 'TEES STARTING AT ₹949',
    subheadline: 'Premium 240 GSM oversized tees at unbeatable prices.',
    ctaLabel: 'SHOP ALL',
    ctaHref: '/shop',
    accent: '#06B6D4',
  },
  {
    name: 'Free shipping',
    desktopImage: '/banners/shop/drops-3-desktop.webp',
    mobileImage: '/banners/shop/drops-3-mobile.webp',
    headline: 'FREE SHIPPING ON ₹999+',
    subheadline: 'No hidden charges. Fast delivery across India.',
    ctaLabel: 'SHOP NOW',
    ctaHref: '/shop',
    accent: '#EC4899',
  },
];

const rows = [
  ...HOME.map((b, i) => ({ ...b, placement: 'home-hero', sortOrder: i + 1, active: true })),
  ...SHOP.map((b, i) => ({ ...b, placement: 'shop-hero', sortOrder: i + 1, active: true })),
];

// A row pointing at a missing file renders a broken frame as the page's
// hero, so check before writing rather than discovering it in the browser.
const missing = [];
for (const r of rows) {
  for (const img of [r.desktopImage, r.mobileImage]) {
    if (img && img.startsWith('/') && !existsSync(path.join(root, 'public', img))) {
      missing.push(img);
    }
  }
}

console.log(`\n${rows.length} banners\n`);
for (const r of rows) {
  const line = r.headline.replace(/\n/g, ' ');
  console.log(`  ${r.placement.padEnd(11)} ${String(r.sortOrder)}. ${line}`);
  console.log(`              ${r.desktopImage}`);
  if (r.code) console.log(`              advertises ${r.code}`);
}

if (missing.length) {
  console.error(`\nMissing image file(s) under public/:`);
  for (const m of [...new Set(missing)]) console.error(`  ${m}`);
  console.error('\nNothing written.\n');
  process.exit(1);
}

if (dryRun) {
  console.log('\n--dry: nothing written.\n');
  process.exit(0);
}

console.log('\nConnecting…');
await mongoose.connect(process.env.MONGODB_URI);

// Defined inline rather than imported: src/lib/models/Banner.js is written
// for the bundler's module resolution, which a plain node script does not
// have. Keep in sync with that file.
const Banner =
  mongoose.models.Banner ||
  mongoose.model(
    'Banner',
    new mongoose.Schema(
      {
        placement: { type: String, default: 'home-hero' },
        name: { type: String, default: '' },
        desktopImage: { type: String, required: true },
        mobileImage: { type: String, default: '' },
        badge: { type: String, default: '' },
        headline: { type: String, default: '' },
        subheadline: { type: String, default: '' },
        ctaLabel: { type: String, default: '' },
        ctaHref: { type: String, default: '/shop' },
        code: { type: String, default: '', uppercase: true },
        accent: { type: String, default: '' },
        sortOrder: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
        startsAt: { type: Date, default: null },
        endsAt: { type: Date, default: null },
      },
      { timestamps: true }
    )
  );

// Any advertised code must exist, be active and be unexpired — the same
// check the admin runs on save. The announcement bar once promised
// WELCOME20, which was never in the database, sending customers to
// "Invalid coupon code" at checkout.
const Coupon =
  mongoose.models.Coupon ||
  mongoose.model(
    'Coupon',
    new mongoose.Schema({ code: String, active: Boolean, expiresAt: Date }, { strict: false })
  );

const codes = [...new Set(rows.map((r) => r.code).filter(Boolean))];
const bad = [];
for (const code of codes) {
  const c = await Coupon.findOne({ code }).lean();
  if (!c) bad.push(`${code} does not exist`);
  else if (c.active === false) bad.push(`${code} is switched off`);
  else if (c.expiresAt && new Date(c.expiresAt) < new Date()) bad.push(`${code} has expired`);
}

if (bad.length) {
  console.error('\nCoupon problem — customers would hit "Invalid coupon code":');
  for (const b of bad) console.error(`  ${b}`);
  console.error('\nNothing written.\n');
  await mongoose.disconnect();
  process.exit(1);
}
console.log(`Coupons checked: ${codes.join(', ') || 'none advertised'}`);

// $setOnInsert only: a slide already reworded or switched off in the admin
// must survive a re-run.
const res = await Banner.bulkWrite(
  rows.map((r) => ({
    updateOne: {
      filter: { placement: r.placement, name: r.name },
      update: { $setOnInsert: r },
      upsert: true,
    },
  })),
  { ordered: false }
);

const home = await Banner.countDocuments({ placement: 'home-hero' });
const shop = await Banner.countDocuments({ placement: 'shop-hero' });

console.log(`\nInserted: ${res.upsertedCount || 0} (existing rows untouched)`);
console.log(`Collection holds ${home} home-hero and ${shop} shop-hero slide(s).\n`);
console.log('Edit them in the admin under Banners.\n');

await mongoose.disconnect();
process.exit(0);
