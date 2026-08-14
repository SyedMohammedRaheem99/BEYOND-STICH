// ============================================
// BEYOND STICH — Product Data-Access Layer (Repository)
// ============================================
//
// This is the SINGLE seam between the UI and the product data source.
// Every page and component must read product/review data through the
// functions exported here — never by importing the seed file directly.
//
// STRATEGY:
//   1. Try to connect to MongoDB and fetch real products.
//   2. If the DB is unreachable or empty, fall back to dummyData.
//   This lets the store work offline / in dev while also serving
//   real data once products are added via the Admin panel.
// --------------------------------------------------------------------------

import { DUMMY_PRODUCTS, DUMMY_REVIEWS } from '@/lib/dummyData';
import { discountPercent } from '@/lib/utils';

// --------------------------------------------------------------------------
// MongoDB helpers (lazy-loaded so builds don't crash)
// --------------------------------------------------------------------------
let _dbReady = null; // cached promise

async function getDB() {
  if (_dbReady !== null) return _dbReady;

  _dbReady = (async () => {
    try {
      const { default: connectDB } = await import('@/lib/mongodb');
      await connectDB();
      const { default: Product } = await import('@/lib/models/Product');
      return Product;
    } catch (err) {
      console.warn('[products.js] MongoDB unavailable, using dummy data:', err.message);
      return null;
    }
  })();

  return _dbReady;
}

// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// Sorters
// --------------------------------------------------------------------------
const SORTERS = {
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  'price-low': (a, b) => a.price - b.price,
  'price-high': (a, b) => b.price - a.price,
  'rating': (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
  'discount': (a, b) => discountPercent(b) - discountPercent(a),
};

const SORT_FIELD_MAP = {
  newest: { createdAt: -1 },
  'price-low': { price: 1 },
  'price-high': { price: -1 },
  'rating': { averageRating: -1 },
  'discount': { price: 1 }, // approximate
};

// --------------------------------------------------------------------------
// Return copies so callers can't accidentally mutate the shared seed.
// --------------------------------------------------------------------------
const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

function applyDummyFilters({ segment, tag, sort } = {}) {
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

// --------------------------------------------------------------------------
// Queries — async, try MongoDB first, fall back to dummy data.
// --------------------------------------------------------------------------

/**
 * Get products with optional filtering + sorting.
 */
export async function getAllProducts({ segment, tag, sort } = {}) {
  try {
    const Product = await getDB();
    if (Product) {
      const filter = { isActive: true };
      if (segment && segment !== 'ALL') filter.segment = segment;
      if (tag) filter.tags = tag;
      const sortObj = SORT_FIELD_MAP[sort] || { createdAt: -1 };
      const docs = await Product.find(filter).sort(sortObj).lean();
      if (docs.length > 0) {
        return docs.map(d => ({ ...d, _id: d._id.toString() }));
      }
    }
  } catch (err) {
    console.warn('[getAllProducts] DB error, using fallback:', err.message);
  }
  return applyDummyFilters({ segment, tag, sort });
}

/** Find a single product by its URL slug. Returns null if not found. */
export async function getProductBySlug(slug) {
  try {
    const Product = await getDB();
    if (Product) {
      const doc = await Product.findOne({ slug, isActive: true }).lean();
      if (doc) return { ...doc, _id: doc._id.toString() };
    }
  } catch (err) {
    console.warn('[getProductBySlug] DB error, using fallback:', err.message);
  }
  const product = DUMMY_PRODUCTS.find((p) => p.slug === slug);
  return product ? clone(product) : null;
}

/** All products belonging to a segment, newest first. */
export async function getProductsBySegment(segmentName) {
  return getAllProducts({ segment: segmentName?.toUpperCase(), sort: 'newest' });
}

/** Newest drops across all segments. */
export async function getLatestDrops(limit = 8) {
  const all = await getAllProducts({ sort: 'newest' });
  return all.slice(0, limit);
}

/** Editorially featured products (falls back to newest if none flagged). */
export async function getFeaturedProducts(limit = 4) {
  try {
    const Product = await getDB();
    if (Product) {
      const docs = await Product.find({ isActive: true, tags: 'featured' })
        .sort({ createdAt: -1 }).limit(limit).lean();
      if (docs.length > 0) {
        return docs.map(d => ({ ...d, _id: d._id.toString() }));
      }
      // No featured tag? Try newest
      const newest = await Product.find({ isActive: true })
        .sort({ createdAt: -1 }).limit(limit).lean();
      if (newest.length > 0) {
        return newest.map(d => ({ ...d, _id: d._id.toString() }));
      }
    }
  } catch (err) {
    console.warn('[getFeaturedProducts] DB error, using fallback:', err.message);
  }
  const featured = applyDummyFilters({ sort: 'newest' }).filter((p) => p.featured);
  const list = featured.length ? featured : applyDummyFilters({ sort: 'newest' });
  return list.slice(0, limit);
}

/** Products related to a given one (same segment, excluding itself). */
export async function getRelatedProducts(slug, limit = 4) {
  try {
    const Product = await getDB();
    if (Product) {
      const product = await Product.findOne({ slug, isActive: true }).lean();
      if (product) {
        const related = await Product.find({
          segment: product.segment,
          slug: { $ne: slug },
          isActive: true,
        }).sort({ createdAt: -1 }).limit(limit).lean();
        if (related.length > 0) {
          return related.map(d => ({ ...d, _id: d._id.toString() }));
        }
      }
    }
  } catch (err) {
    console.warn('[getRelatedProducts] DB error, using fallback:', err.message);
  }
  const product = DUMMY_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return [];
  const related = applyDummyFilters({ segment: product.segment, sort: 'newest' })
    .filter((p) => p.slug !== slug);
  return related.slice(0, limit);
}

/** Total number of active products. */
export async function getProductCount(opts = {}) {
  const all = await getAllProducts(opts);
  return all.length;
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
