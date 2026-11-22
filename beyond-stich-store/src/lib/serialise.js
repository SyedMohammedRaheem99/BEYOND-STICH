/**
 * Convert Mongoose documents into plain objects safe to hand a Client
 * Component.
 *
 * `.lean()` returns something close to a plain object, but ObjectIds stay
 * ObjectIds and Dates stay Dates — both carry a `toJSON` method, which is
 * exactly what React refuses to serialise across the server/client
 * boundary:
 *
 *   Only plain objects can be passed to Client Components from Server
 *   Components. Objects with toJSON methods are not supported.
 *
 * The catalogue pages each converted `_id` by hand and missed `createdAt`
 * and `updatedAt`, so every product page logged the warning three times.
 * Worse than the noise: a Date arrives as a Date on the server and as a
 * string on the client, so formatting one is a hydration mismatch waiting
 * to happen.
 */

/**
 * Deep-convert ObjectIds, Dates, Maps and Buffers to primitives.
 *
 * Generic rather than product-shaped so the same helper serves orders,
 * reviews and anything else handed to a client component.
 */
export function serialise(value) {
  if (value === null || value === undefined) return value;

  // Date -> ISO string. Chosen over a timestamp so the value stays
  // readable in devtools and parses with `new Date(...)` unchanged.
  if (value instanceof Date) return value.toISOString();

  // Map -> plain object. Size charts store measurements as a Map.
  if (value instanceof Map) {
    const out = {};
    for (const [k, v] of value) out[k] = serialise(v);
    return out;
  }

  if (Array.isArray(value)) return value.map(serialise);

  if (typeof value === 'object') {
    // ObjectId and Buffer both expose toHexString/toString; neither is a
    // plain object, and both appear on documents that reach the client.
    if (typeof value.toHexString === 'function') return value.toHexString();
    if (Buffer.isBuffer?.(value)) return value.toString('hex');

    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialise(v);
    return out;
  }

  return value;
}

/** One lean product document, ready to hand a client component. */
export function serialiseProduct(doc) {
  return doc ? serialise(doc) : null;
}

/** A list of them. */
export function serialiseProducts(docs = []) {
  return docs.map(serialiseProduct);
}
