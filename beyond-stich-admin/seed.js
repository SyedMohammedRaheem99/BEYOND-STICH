require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

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
