/**
 * Creates the two welcome coupons the storefront advertises.
 *
 * The site previously promoted WELCOME20 and BUNDLE10 in the hero, the
 * announcement bar and the promo cards — neither existed in the database, so
 * customers reached checkout, typed the code, and got "Invalid coupon code".
 * These are the codes the copy now references, with values that match
 * WELCOME_TIERS in the storefront's constants.js.
 *
 * Safe to re-run: updates the coupons in place rather than duplicating them.
 *
 *   node create-welcome-coupons.js
 */
require('dotenv').config({ path: '.env.local', override: false });
const dns = require('dns');
const mongoose = require('mongoose');

// Some local resolvers refuse the SRV lookup mongodb+srv:// needs.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const COUPONS = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minOrder: 949, // matches the cheapest tee, so any single tee qualifies
    maxDiscount: 0,
    active: true,
    firstOrderOnly: true,
    description: '10% off your first order above ₹949',
  },
  {
    code: 'WELCOME25',
    type: 'percent',
    value: 25,
    minOrder: 1999, // two tees
    maxDiscount: 0,
    active: true,
    firstOrderOnly: true,
    description: '25% off your first order above ₹1999',
  },
];

(async () => {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set in .env.local');

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
    const coupons = mongoose.connection.db.collection('coupons');

    for (const c of COUPONS) {
      const existing = await coupons.findOne({ code: c.code });
      await coupons.updateOne(
        { code: c.code },
        {
          $set: { ...c, updatedAt: new Date() },
          // Never reset the usage counter on an existing coupon.
          $setOnInsert: { usedCount: 0, usageLimit: 0, expiresAt: null, createdAt: new Date() },
        },
        { upsert: true }
      );
      console.log(`  ${existing ? 'Updated' : 'Created'} ${c.code} — ${c.description}`);
    }

    console.log('\n  Active coupons now in the database:');
    const all = await coupons.find({ active: true }).project({ code: 1, minOrder: 1, value: 1 }).toArray();
    all.forEach((c) => console.log(`    - ${c.code}: ${c.value}% off above ₹${c.minOrder}`));
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error(`\n  Failed: ${err.message}\n`);
    process.exit(1);
  }
})();
