/**
 * One-off: create or update an admin account.
 *
 * Credentials come from the environment so they are never written to a file
 * or committed. Run from the beyond-stich-admin directory:
 *
 *   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="your-strong-password" node create-admin.js
 *
 * Re-running with the same email resets that account's password.
 */
// Load .env.local, but let anything already exported in the shell win. Some
// networks refuse the SRV DNS lookup that mongodb+srv:// needs, so you may
// need to pass a standard mongodb:// URI via MONGODB_URI to run this.
require('dotenv').config({ path: '.env.local', override: false });
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Some local resolvers refuse the SRV lookup that mongodb+srv:// depends on
// (ECONNREFUSED on _mongodb._tcp...). Point Node at public DNS so this script
// works regardless of the machine's DNS setup. Production is unaffected.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
const name = (process.env.ADMIN_NAME || 'Admin').trim();

function fail(msg) {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
}

if (!email || !password) {
  fail('Set ADMIN_EMAIL and ADMIN_PASSWORD. See the comment at the top of this file.');
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  fail(`"${email}" is not a valid email address.`);
}
// This account can edit products, read every customer order, and issue
// refunds. A short password is not adequate protection for that.
if (password.length < 12) {
  fail('Use a password of at least 12 characters for an admin account.');
}
if (!process.env.MONGODB_URI) {
  fail('MONGODB_URI is missing from .env.local');
}

process.on('unhandledRejection', (err) => fail(`Unhandled error: ${err?.message || err}`));

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log(`\n  Connecting to ${uri.replace(/\/\/[^@]+@/, '//***@').slice(0, 80)}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      // Talk to one node directly when the URI names a single host. Avoids
      // needing the exact replicaSet name, which the driver otherwise
      // enforces strictly.
      ...(process.env.MONGODB_DIRECT === '1' ? { directConnection: true } : {}),
    });
    console.log('  Connected.');
    const users = mongoose.connection.db.collection('users');

    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await users.findOne({ email });

    if (existing) {
      await users.updateOne(
        { _id: existing._id },
        { $set: { passwordHash, role: 'admin', name, updatedAt: new Date() } }
      );
      console.log(`\n  Updated existing account: ${email}`);
      console.log('  Password reset and admin role confirmed.\n');
    } else {
      await users.insertOne({
        name,
        email,
        passwordHash,
        role: 'admin',
        provider: 'credentials',
        addresses: [],
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`\n  Created admin account: ${email}\n`);
    }

    const admins = await users.find({ role: 'admin' }).project({ email: 1 }).toArray();
    console.log('  Admin accounts now in the database:');
    admins.forEach((a) => console.log(`    - ${a.email}`));
    console.log('');

    process.exit(0);
  } catch (err) {
    fail(`Failed: ${err.message}`);
  }
})();
