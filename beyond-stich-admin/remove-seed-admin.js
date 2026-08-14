/**
 * One-off: remove the seeded admin account.
 *
 * seed.js creates admin@beyondstich.com with the password 'admin'. That is a
 * working backdoor into the admin panel, which can read every customer's
 * address and phone number, so it must not exist on a live store.
 *
 * Refuses to run unless another admin account remains, so you can't lock
 * yourself out.
 *
 *   node remove-seed-admin.js
 */
require('dotenv').config({ path: '.env.local', override: false });
const dns = require('dns');
const mongoose = require('mongoose');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const TARGET = 'admin@beyondstich.com';

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
    const users = mongoose.connection.db.collection('users');

    const others = await users
      .find({ role: 'admin', email: { $ne: TARGET } })
      .project({ email: 1 })
      .toArray();

    if (others.length === 0) {
      console.error(`\n  Refusing to delete ${TARGET}: it is the only admin account.`);
      console.error('  Create your own admin first with create-admin.js.\n');
      process.exit(1);
    }

    const res = await users.deleteOne({ email: TARGET, role: 'admin' });

    console.log(
      res.deletedCount
        ? `\n  Removed seeded admin account: ${TARGET}`
        : `\n  Nothing to remove — ${TARGET} does not exist.`
    );
    console.log('\n  Admin accounts remaining:');
    others.forEach((a) => console.log(`    - ${a.email}`));
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error(`\n  Failed: ${err.message}\n`);
    process.exit(1);
  }
})();
