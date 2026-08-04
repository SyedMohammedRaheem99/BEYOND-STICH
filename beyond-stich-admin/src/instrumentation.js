// Runs once at server startup (Next.js instrumentation hook), before any
// request is handled. Some local networks refuse Node's SRV DNS lookups
// (mongodb+srv), so we point DNS at public resolvers here to guarantee the
// Atlas connection string resolves. Harmless in production.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setServers } = await import('node:dns');
    setServers(['8.8.8.8', '1.1.1.1']);
  }
}
