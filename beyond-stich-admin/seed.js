require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Some local networks refuse Node's SRV DNS lookups (mongodb+srv). Point DNS
// at public resolvers so the Atlas connection string resolves reliably.
require('dns').setServers(['8.8.8.8', '1.1.1.1']);

const seedAdmin = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // DISABLED. This created admin@beyondstich.com with the password 'admin'
    // — a working backdoor into an account that can read every customer's
    // address and phone number. Use create-admin.js instead, which takes the
    // credentials from the environment and enforces a minimum length.
    console.error('\n  seed.js is disabled: it created an admin with the password "admin".');
    console.error('  Use create-admin.js instead:\n');
    console.error('    ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" node create-admin.js\n');
    process.exit(1);

    // eslint-disable-next-line no-unreachable
    const db = mongoose.connection.useDb(mongoose.connection.name);

    // We are directly inserting into the 'users' collection
    const passwordHash = await bcrypt.hash('admin', 12);
    
    // Check if user already exists
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@beyondstich.com' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists!');
      process.exit(0);
    }

    await db.collection('users').insertOne({
      name: 'Super Admin',
      email: 'admin@beyondstich.com',
      passwordHash: passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('🎉 Successfully created admin user!');
    console.log('-----------------------------------');
    console.log('Email:    admin@beyondstich.com');
    console.log('Password: admin');
    console.log('-----------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
