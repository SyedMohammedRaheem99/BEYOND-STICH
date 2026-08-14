import dns from 'node:dns';
// Force public DNS resolvers — local/private network DNS often blocks
// the SRV lookups needed by mongodb+srv:// connection strings.
try { dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']); } catch (_) {}

import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  // Checked here (not at module level) so builds don't crash when the env var
  // isn't set yet.
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Fail fast (12s) with a clear error instead of hanging 30s when the DB
      // is unreachable (e.g. the Atlas IP allowlist doesn't include this IP).
      serverSelectionTimeoutMS: 12000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
