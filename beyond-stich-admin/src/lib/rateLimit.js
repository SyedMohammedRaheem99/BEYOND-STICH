// Lightweight in-memory rate limiter.
//
// Serverless instances don't share memory, so this is a best-effort control
// rather than a hard global guarantee — it still stops the naive scripted
// abuse it's aimed at (password guessing, reset-mail bombing, review spam).
// Move to Redis/Upstash if abuse becomes targeted.

const buckets = new Map();
const MAX_BUCKETS = 10_000;

// Identify the caller. Vercel sets x-forwarded-for; fall back to a constant so
// a missing header degrades to a shared bucket rather than no limit at all.
export function clientKey(request) {
  const fwd = request.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Returns null when the request may proceed, or the number of seconds to wait.
 *
 * @param {string} name   logical bucket, e.g. 'login'
 * @param {string} id     caller identity, usually from clientKey()
 * @param {number} limit  allowed hits per window
 * @param {number} windowMs
 */
export function rateLimit(name, id, limit, windowMs) {
  const key = `${name}:${id}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    // Opportunistically drop expired buckets so memory can't grow unbounded.
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= limit) {
    return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  }

  entry.count += 1;
  return null;
}

// Standard 429 for a limited request.
export function tooManyRequests(retryAfter, message = 'Too many requests. Please try again shortly.') {
  return Response.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
