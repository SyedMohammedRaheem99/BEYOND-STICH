/**
 * What is actually in the database.
 *
 *   node scripts/check-db.mjs
 *
 * Mainly a pre-deploy check: two collections must be populated or the live
 * store is broken in ways that are not obvious from the outside —
 * no delivery zones means every order is refused at checkout, and no
 * product types means the admin's product form has nothing to choose from.
 *
 * Reads the MONGODB_URI in .env.local, so it reports on whichever cluster
 * that points at.
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
    process.env[key] = value;
  }
} catch {
  console.error('Could not read .env.local\n');
  process.exit(1);
}

const host = (process.env.MONGODB_URI || '').replace(
  /mongodb\+srv:\/\/[^:]+:[^@]+@([^/?]+).*/,
  '$1'
);
console.log(`\nCluster: ${host}\n`);

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const count = (c) => db.collection(c).countDocuments();

const deliveryZones = await count('deliveryzones');
const productTypes = await count('producttypes');
const products = await count('products');
const orders = await count('orders');
const users = await count('users');

// These two block the store outright when empty, so they are reported as
// pass/fail rather than as a number.
const required = [
  ['deliveryzones', deliveryZones, 'every order would be refused at checkout'],
  ['producttypes', productTypes, 'the admin product form would have no types'],
];

let blocked = false;
console.log('Required:');
for (const [name, n, consequence] of required) {
  if (n > 0) {
    console.log(`  OK    ${name.padEnd(15)} ${n}`);
  } else {
    blocked = true;
    console.log(`  EMPTY ${name.padEnd(15)} 0  — ${consequence}`);
  }
}

console.log('\nCatalogue:');
console.log(`        products        ${products}`);
console.log(`        orders          ${orders}`);
console.log(`        users           ${users}`);

if (deliveryZones > 0) {
  const zones = await db.collection('deliveryzones').find({}).sort({ rangeStart: 1 }).toArray();
  console.log('\nDelivery areas:');
  for (const z of zones) {
    console.log(
      `  ${String(z.name).padEnd(30)} ${z.rangeStart}-${z.rangeEnd}  ${String(z.zone).padEnd(7)}` +
        `${z.codAvailable ? 'COD' : 'prepaid only'}${z.active === false ? '  (OFF)' : ''}`
    );
  }
}

if (productTypes > 0) {
  const types = await db.collection('producttypes').find({}).sort({ sortOrder: 1 }).toArray();
  console.log('\nProduct types:');
  for (const t of types) {
    console.log(
      `  ${String(t.name).padEnd(14)} sizes: ${(t.sizes || []).join(', ')}`.padEnd(52) +
        `${(t.specTemplate || []).length} spec rows`
    );
  }
}

if (blocked) {
  console.log('\nRun the missing seed(s):');
  if (deliveryZones === 0) console.log('  node scripts/seed-delivery.mjs');
  if (productTypes === 0) console.log('  node scripts/seed-product-types.mjs');
  console.log('');
} else {
  console.log('\nReady to serve orders.\n');
}

await mongoose.disconnect();
process.exit(blocked ? 1 : 0);
