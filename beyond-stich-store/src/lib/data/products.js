// ============================================
// BEYOND STICH — Product Data-Access Layer (Repository)
// ============================================
//
// This is the SINGLE seam between the UI and the product data source.
// Every page and component must read product/review data through the
// functions exported here — never by importing the seed file directly.
//
// TODAY:  these functions read from the local seed catalog (dummyData).
// LATER:  in the database-integration phase, replace ONLY the bodies of
//         these functions with MongoDB queries (or fetches to the admin
//         API). The function names, arguments and return shapes stay the
//         same, so no page or component needs to change.
//
// When that happens, these will become `async` and the few page shells
// that consume them become server components with `await`. That change is
// isolated to this file + those page shells — nothing else.
// --------------------------------------------------------------------------

import { DUMMY_PRODUCTS, DUMMY_REVIEWS } from '@/lib/dummyData';

// Return copies so callers can't accidentally mutate the shared seed.
const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

const SORTERS = {
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  'price-low': (a, b) => a.price - b.price,
  'price-high': (a, b) => b.price - a.price,
  'rating': (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
  'discount': (a, b) => discountPercent(b) - discountPercent(a),
};

// --------------------------------------------------------------------------
// Derived helpers (pure) — safe to reuse in UI too.
// --------------------------------------------------------------------------
export function discountPercent(product) {
  if (!product || product.mrp <= product.price) return 0;
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

export function totalStock(product) {
  if (!product?.sizes) return 0;
  return product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
}

export function isInStock(product) {
  return totalStock(product) > 0;
}

// --------------------------------------------------------------------------
// Queries
// --------------------------------------------------------------------------

/**
 * Get products with optional filtering + sorting.
 * @param {object} opts
 * @param {string} [opts.segment] - segment name (e.g. 'GYM') or 'ALL'
 * @param {string} [opts.tag] - only products carrying this tag
 * @param {keyof typeof SORTERS} [opts.sort] - sort key
 */
export function getAllProducts({ segment, tag, sort } = {}) {
  let list = [...DUMMY_PRODUCTS];

  if (segment && segment !== 'ALL') {
    list = list.filter((p) => p.segment === segment);
  }
  if (tag) {
    list = list.filter((p) => p.tags?.includes(tag));
  }
  if (sort && SORTERS[sort]) {
    list.sort(SORTERS[sort]);
  }

  return clone(list);
}

/** Find a single product by its URL slug. Returns null if not found. */
export function getProductBySlug(slug) {
  const product = DUMMY_PRODUCTS.find((p) => p.slug === slug);
  return product ? clone(product) : null;
}

/** All products belonging to a segment, newest first. */
export function getProductsBySegment(segmentName) {
  return getAllProducts({ segment: segmentName?.toUpperCase(), sort: 'newest' });
}

/** Newest drops across all segments. */
export function getLatestDrops(limit = 8) {
  return getAllProducts({ sort: 'newest' }).slice(0, limit);
}

/** Editorially featured products (falls back to newest if none flagged). */
export function getFeaturedProducts(limit = 4) {
  const featured = getAllProducts({ sort: 'newest' }).filter((p) => p.featured);
  const list = featured.length ? featured : getLatestDrops(limit);
  return list.slice(0, limit);
}

/** Products related to a given one (same segment, excluding itself). */
export function getRelatedProducts(slug, limit = 4) {
  const product = DUMMY_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return [];
  const related = getAllProducts({ segment: product.segment, sort: 'newest' })
    .filter((p) => p.slug !== slug);
  return related.slice(0, limit);
}

/** Total number of active products (for counts / "X drops"). */
export function getProductCount(opts = {}) {
  return getAllProducts(opts).length;
}

// --------------------------------------------------------------------------
// Reviews
// --------------------------------------------------------------------------

/**
 * Reviews + summary for a product.
 * @returns {{ reviews: Array, average: number, count: number }}
 */
export function getReviewsForProduct(productId) {
  const reviews = clone(DUMMY_REVIEWS[productId] || []);
  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;
  return { reviews, average, count };
}
