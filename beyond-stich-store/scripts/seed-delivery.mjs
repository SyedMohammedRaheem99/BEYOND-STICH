/**
 * Seed the delivery areas.
 *
 *   node scripts/seed-delivery.mjs         # write them
 *   node scripts/seed-delivery.mjs --dry   # show them, change nothing
 *
 * Starts with Bengaluru and the surrounding belt, which is where the store
 * actually ships today. Everywhere else is simply absent, so the PIN check
 * answers "we don't deliver there yet" — the honest answer, and the one
 * that stops a COD parcel being accepted for an address no courier will
 * reach.
 *
 * Opening a new city later is one row added in the admin.
 *
 * Safe to re-run: existing rows are left exactly as they are, so anything
 * edited or switched off in the admin survives.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import mongoose from 'mongoose';

// Same workaround as src/lib/mongodb.js: many home and office routers
// refuse the SRV lookup that a mongodb+srv:// connection string needs, so
// the default resolver fails with ECONNREFUSED while the host is perfectly
// reachable. Point at public resolvers before connecting.
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

/**
 * name, rangeStart, rangeEnd, zone, codAvailable
 *
 * 560001–560999 is Bengaluru proper. 561xxx–562xxx covers the ring towns
 * (Devanahalli, Hoskote, Anekal, Nelamangala) that the same courier run
 * reaches a day later.
 */
const ZONES = [
  ['Bengaluru City', 560001, 560999, 'local', true],
  ['Bengaluru Rural & Ring Towns', 561001, 562999, 'nearby', true],
];

console.log(`\n${ZONES.length} delivery areas\n`);
for (const [name, a, b, zone, cod] of ZONES) {
  console.log(`  ${name.padEnd(32)} ${a}–${b}  ${zone.padEnd(7)} ${cod ? 'COD' : 'prepaid only'}`);
}
console.log('\nEverything else: "We don\'t deliver to this PIN code yet."');

if (dryRun) {
  console.log('\n--dry: nothing written.\n');
  process.exit(0);
}

console.log('\nConnecting…');
await mongoose.connect(process.env.MONGODB_URI);

const DeliveryZone =
  mongoose.models.DeliveryZone ||
  mongoose.model(
    'DeliveryZone',
    new mongoose.Schema(
      {
        name: String,
        rangeStart: Number,
        rangeEnd: Number,
        zone: String,
        deliveryDaysMin: { type: Number, default: null },
        deliveryDaysMax: { type: Number, default: null },
        codAvailable: { type: Boolean, default: true },
        active: { type: Boolean, default: true },
        notes: String,
      },
      { timestamps: true }
    )
  );

// $setOnInsert only: an area already retimed or switched off in the admin
// must survive a re-run of this script.
const res = await DeliveryZone.bulkWrite(
  ZONES.map(([name, rangeStart, rangeEnd, zone, codAvailable]) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, rangeStart, rangeEnd, zone, codAvailable, active: true } },
      upsert: true,
    },
  })),
  { ordered: false }
);

const total = await DeliveryZone.countDocuments();
console.log(`\nInserted: ${res.upsertedCount || 0}`);
console.log(`Collection holds ${total} area(s).\n`);
console.log('Add more in the admin under Delivery.\n');

await mongoose.disconnect();
process.exit(0);
