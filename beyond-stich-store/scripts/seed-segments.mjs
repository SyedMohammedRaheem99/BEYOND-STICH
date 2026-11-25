/**
 * Seed the 13 hardcoded segments into the segments collection.
 *
 *   node scripts/seed-segments.mjs --dry   # show them, change nothing
 *   node scripts/seed-segments.mjs         # write them
 *
 * Copy, taglines, accents and long descriptions are read straight from
 * src/lib/constants.js rather than retyped, so seeding cannot introduce a
 * difference between what the site shows today and what it shows afterwards.
 * That is the whole point: this should be invisible to a customer.
 *
 * Safe to re-run: rows are matched on slug and only inserted, never
 * overwritten, so anything edited in the admin survives.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import mongoose from 'mongoose';

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

// Pulled from the real constants file so the two can never disagree.
const { SEGMENTS } = await import('../src/lib/constants.js');

const dryRun = process.argv.includes('--dry');

const rows = SEGMENTS.map((s, i) => ({
  slug: s.id,
  name: s.name,
  tagline: s.tagline || '',
  description: s.description || '',
  longDescription: s.longDescription || '',
  accent: s.accent || '',
  icon: '',
  image: '',
  sortOrder: i + 1,
  active: true,
  // RANDOMS was excluded from the home grid by a hardcoded filter in
  // SegmentGrid. That rule becomes data here.
  showInGrid: s.id !== 'randoms',
}));

console.log(`\n${rows.length} segments\n`);
for (const r of rows) {
  console.log(
    `  ${String(r.sortOrder).padStart(2)}. ${r.name.padEnd(13)} /${r.slug.padEnd(12)} ` +
    `${r.accent || '(no accent)'}  ${r.showInGrid ? '' : '(hidden from grid)'}`
  );
  console.log(`      ${r.tagline}`);
}

if (dryRun) {
  console.log('\n--dry: nothing written.\n');
  process.exit(0);
}

console.log('\nConnecting…');
await mongoose.connect(process.env.MONGODB_URI);

// Defined inline: src/lib/models/Segment.js is written for the bundler's
// module resolution, which a plain node script does not have. Keep in sync.
const Segment =
  mongoose.models.Segment ||
  mongoose.model(
    'Segment',
    new mongoose.Schema(
      {
        slug: { type: String, unique: true, lowercase: true },
        name: { type: String, unique: true, uppercase: true },
        tagline: String,
        description: String,
        longDescription: String,
        accent: String,
        icon: String,
        image: String,
        sortOrder: Number,
        active: { type: Boolean, default: true },
        showInGrid: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  );

// $setOnInsert only: a segment already reworded in the admin must survive.
const res = await Segment.bulkWrite(
  rows.map((r) => ({
    updateOne: { filter: { slug: r.slug }, update: { $setOnInsert: r }, upsert: true },
  })),
  { ordered: false }
);

const total = await Segment.countDocuments();

// Every product's segment must match a row, or that product disappears from
// its own world. Worth knowing now rather than from a customer.
const products = mongoose.connection.collection('products');
const used = await products.distinct('segment');
const names = new Set(rows.map((r) => r.name));
const orphans = used.filter((u) => u && !names.has(u));

console.log(`\nInserted: ${res.upsertedCount || 0} (existing rows untouched)`);
console.log(`Collection holds ${total} segment(s).`);
console.log(
  orphans.length
    ? `\nWARNING — products reference segments that do not exist: ${orphans.join(', ')}`
    : '\nEvery product\'s segment resolves to a real row.'
);
console.log('\nEdit them in the admin under Segments.\n');

await mongoose.disconnect();
process.exit(0);
