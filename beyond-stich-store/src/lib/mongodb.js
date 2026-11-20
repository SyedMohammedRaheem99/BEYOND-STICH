import dns from 'node:dns';
import mongoose from 'mongoose';

// Force public DNS resolvers — local/private network DNS often blocks the
// SRV lookups that mongodb+srv:// connection strings require.
const PUBLIC_RESOLVERS = ['8.8.8.8', '1.1.1.1', '8.8.4.4'];

/**
 * Applied immediately before connecting, not once at module load.
 *
 * Setting them at import time was not enough under Turbopack: the module
 * runs in its own scope, and Node had already created the resolver channel
 * that actually performs the lookup, so the first querySrv still went to
 * the system resolver and failed with ECONNREFUSED. Calling setServers()
 * again at connect time rebuilds that channel with the right list — which
 * is why a second call always succeeded where the first did not.
 */
// Named with a verb, not "use…": ESLint reads a use-prefixed function as a
// React hook and rejects calling it from a plain function.
function applyPublicResolvers() {
  try {
    const current = dns.getServers();
    const alreadySet =
      current.length === PUBLIC_RESOLVERS.length &&
      PUBLIC_RESOLVERS.every((s, i) => current[i] === s);
    // Re-set even when the list looks right: it is the call itself that
    // rebuilds the channel, not the value.
    dns.setServers(alreadySet ? [...PUBLIC_RESOLVERS] : PUBLIC_RESOLVERS);
  } catch {
    // A locked-down runtime may refuse; the system resolver may still work.
  }
}

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
    // Must run before mongoose resolves the +srv hostname.
    applyPublicResolvers();

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
