/**
 * Seed the product types.
 *
 *   node scripts/seed-product-types.mjs         # write them
 *   node scripts/seed-product-types.mjs --dry   # show them, change nothing
 *
 * Each type carries the DEFAULTS for a new product of that kind: its size
 * run, the rows its spec table usually has, and its size chart. None of it
 * is enforced — the product form pre-fills from here and the operator is
 * free to change everything on the product itself.
 *
 * Safe to re-run: existing types are left exactly as they are, so anything
 * edited in the admin survives.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import mongoose from 'mongoose';

// Same workaround as src/lib/mongodb.js: many routers refuse the SRV
// lookup a mongodb+srv:// string needs.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  /* default resolver may still work */
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

// Garment measurements, laid flat, in inches. The tee chart is the one the
// storefront previously hard-coded in two places.
const TEE_ROWS = [
  ['S', 42, 27, 21], ['M', 44, 28, 22], ['L', 46, 29, 23],
  ['XL', 48, 30, 24], ['XXL', 50, 31, 25],
];
const HOODIE_ROWS = [
  ['S', 44, 27, 22], ['M', 46, 28, 23], ['L', 48, 29, 24],
  ['XL', 50, 30, 25], ['XXL', 52, 31, 26],
];
const PANT_ROWS = [
  ['28', 28, 40, 11], ['30', 30, 40, 11], ['32', 32, 41, 12],
  ['34', 34, 41, 12], ['36', 36, 42, 12],
];

const row = (cols) => ([size, ...vals]) => ({
  size: String(size),
  measurements: Object.fromEntries(cols.map((c, i) => [c, String(vals[i])])),
});

const TOP_COLS = ['Chest', 'Length', 'Shoulder'];
const PANT_COLS = ['Waist', 'Length', 'Thigh'];

const TOP_GUIDE = [
  { label: 'Chest', defaultValue: 'Measure across the fullest part, armpit to armpit, and double it.' },
  { label: 'Length', defaultValue: 'From the highest point of the shoulder straight down to the hem.' },
  { label: 'Shoulder', defaultValue: 'From one shoulder seam across to the other.' },
];

const TYPES = [
  {
    name: 'T-Shirt',
    sortOrder: 1,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    specTemplate: [
      { label: 'Fabric', defaultValue: '100% Combed Cotton' },
      { label: 'GSM', defaultValue: '240' },
      { label: 'Fit', defaultValue: 'Oversized' },
      { label: 'Neck', defaultValue: 'Round Neck' },
      { label: 'Sleeve', defaultValue: 'Half Sleeve, Drop Shoulder' },
      { label: 'Pattern', defaultValue: 'Printed' },
      { label: 'Country of Origin', defaultValue: 'India' },
    ],
    chartColumns: TOP_COLS,
    chartRows: TEE_ROWS.map(row(TOP_COLS)),
    chartNote: 'Measurements are of the garment, laid flat, in inches. Cut for an oversized fit — size down for a regular look.',
    measureGuide: TOP_GUIDE,
  },
  {
    name: 'Hoodie',
    sortOrder: 2,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    specTemplate: [
      { label: 'Fabric', defaultValue: 'Cotton Fleece' },
      { label: 'GSM', defaultValue: '340' },
      { label: 'Fit', defaultValue: 'Regular' },
      { label: 'Neck', defaultValue: 'Hooded' },
      { label: 'Sleeve', defaultValue: 'Full Sleeve' },
      { label: 'Pockets', defaultValue: 'Kangaroo Pocket' },
      { label: 'Country of Origin', defaultValue: 'India' },
    ],
    chartColumns: TOP_COLS,
    chartRows: HOODIE_ROWS.map(row(TOP_COLS)),
    chartNote: 'Measurements are of the garment, laid flat, in inches.',
    measureGuide: TOP_GUIDE,
  },
  {
    name: 'Sweatshirt',
    sortOrder: 3,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    specTemplate: [
      { label: 'Fabric', defaultValue: 'Cotton Fleece' },
      { label: 'GSM', defaultValue: '320' },
      { label: 'Fit', defaultValue: 'Regular' },
      { label: 'Neck', defaultValue: 'Round Neck' },
      { label: 'Sleeve', defaultValue: 'Full Sleeve' },
      { label: 'Country of Origin', defaultValue: 'India' },
    ],
    chartColumns: TOP_COLS,
    chartRows: HOODIE_ROWS.map(row(TOP_COLS)),
    chartNote: 'Measurements are of the garment, laid flat, in inches.',
    measureGuide: TOP_GUIDE,
  },
  {
    name: 'Pants',
    sortOrder: 4,
    sizes: ['28', '30', '32', '34', '36'],
    specTemplate: [
      { label: 'Fabric', defaultValue: 'Cotton Blend' },
      { label: 'Fit', defaultValue: 'Relaxed' },
      { label: 'Closure', defaultValue: 'Drawstring' },
      { label: 'Pockets', defaultValue: 'Side Pockets' },
      { label: 'Country of Origin', defaultValue: 'India' },
    ],
    chartColumns: PANT_COLS,
    chartRows: PANT_ROWS.map(row(PANT_COLS)),
    chartNote: 'Waist is the flat measurement, doubled. All measurements in inches.',
    measureGuide: [
      { label: 'Waist', defaultValue: 'Measure across the waistband, flat, and double it.' },
      { label: 'Length', defaultValue: 'From the top of the waistband straight down to the hem.' },
      { label: 'Thigh', defaultValue: 'Measure across the widest point below the crotch seam.' },
    ],
  },
  {
    name: 'Cap',
    sortOrder: 5,
    sizes: ['Free Size'],
    specTemplate: [
      { label: 'Fabric', defaultValue: 'Cotton Twill' },
      { label: 'Closure', defaultValue: 'Adjustable Strap' },
      { label: 'Country of Origin', defaultValue: 'India' },
    ],
    chartColumns: ['Head Circumference'],
    chartRows: [{ size: 'Free Size', measurements: { 'Head Circumference': '21–23' } }],
    chartNote: 'Adjustable — fits most head sizes. Measurement in inches.',
    measureGuide: [
      { label: 'Head Circumference', defaultValue: 'Measure around your head, just above the ears.' },
    ],
  },
];

console.log(`\n${TYPES.length} product types\n`);
for (const t of TYPES) {
  console.log(`  ${t.name.padEnd(12)} sizes: ${t.sizes.join(', ').padEnd(24)} ${t.specTemplate.length} spec rows · ${t.chartRows.length} chart rows`);
}

if (dryRun) {
  console.log('\n--dry: nothing written.\n');
  process.exit(0);
}

console.log('\nConnecting…');
await mongoose.connect(process.env.MONGODB_URI);

const ProductType =
  mongoose.models.ProductType ||
  mongoose.model(
    'ProductType',
    new mongoose.Schema(
      {
        name: { type: String, required: true, unique: true },
        sizes: [String],
        specTemplate: [{ label: String, defaultValue: String, _id: false }],
        chartColumns: [String],
        chartRows: [{ size: String, measurements: { type: Map, of: String }, _id: false }],
        chartNote: String,
        measureGuide: [{ label: String, defaultValue: String, _id: false }],
        sortOrder: Number,
        active: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  );

// $setOnInsert only: a type already edited in the admin must survive.
const res = await ProductType.bulkWrite(
  TYPES.map((t) => ({
    updateOne: {
      filter: { name: t.name },
      update: { $setOnInsert: { ...t, active: true } },
      upsert: true,
    },
  })),
  { ordered: false }
);

const total = await ProductType.countDocuments();
console.log(`\nInserted: ${res.upsertedCount || 0}`);
console.log(`Left untouched: ${TYPES.length - (res.upsertedCount || 0)}`);
console.log(`Collection holds ${total} type(s).\n`);

// Existing products predate productType. Stamping them keeps the catalogue
// consistent and lets the PDP resolve a size chart for them.
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
const stamped = await Product.updateMany(
  { $or: [{ productType: { $exists: false } }, { productType: '' }, { productType: null }] },
  { $set: { productType: 'T-Shirt' } }
);
console.log(`Existing products stamped as T-Shirt: ${stamped.modifiedCount}\n`);

await mongoose.disconnect();
process.exit(0);
