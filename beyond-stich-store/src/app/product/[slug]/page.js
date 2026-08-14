import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';
import { DUMMY_PRODUCTS, DUMMY_REVIEWS } from '@/lib/dummyData';
import ProductSchema from '@/components/seo/ProductSchema';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import ProductDetailClient from './ProductDetailClient';

// Serve catalog pages from cache for 5 minutes. Without this every
// visit blocks on a MongoDB round trip before any HTML ships.
export const revalidate = 300;

// Server-side product fetch (direct DB, no HTTP round-trip)
async function getProduct(slug) {
  // If the database answers, its answer is final — a missing product must 404
  // rather than fall back to seed data, or the store advertises tees it does
  // not stock. The seed fallback now only covers a genuine DB outage.
  try {
    await connectDB();
    const doc = await Product.findOne({ slug, isActive: true }).lean();
    return doc ? { ...doc, _id: doc._id.toString() } : null;
  } catch {
    return DUMMY_PRODUCTS.find((p) => p.slug === slug) || null;
  }
}

// Server-side related products fetch
async function getRelated(slug, segment) {
  try {
    await connectDB();
    const docs = await Product.find({ segment, slug: { $ne: slug }, isActive: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    // An empty result is a valid answer (no siblings in this segment yet) —
    // don't paper over it with seed products that aren't for sale.
    return docs.map((d) => ({ ...d, _id: d._id.toString() }));
  } catch {
    return DUMMY_PRODUCTS.filter((p) => p.segment === segment && p.slug !== slug).slice(0, 4);
  }
}

// Server-side reviews fetch — pre-renders review content for Google indexing
async function getReviews(slug) {
  try {
    await connectDB();
    const reviews = await Review.find({ productSlug: slug, approved: true })
      .sort({ createdAt: -1 })
      .lean();
    const count = reviews.length;
    const average = count
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    return {
      reviews: reviews.map((r) => ({ ...r, _id: r._id.toString() })),
      average,
      count,
      distribution,
    };
  } catch {
    // Never invent reviews. Seeded testimonials carry real-looking names and
    // feed the AggregateRating schema sent to Google, so showing them on a
    // live store would be fabricated social proof. An outage shows none.
  }
  return { reviews: [], average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;

  const [product, reviewData] = await Promise.all([
    getProduct(slug),
    getReviews(slug),
  ]);

  if (!product) notFound();

  const relatedProducts = await getRelated(slug, product.segment);

  // Merge live review stats into product for schema (aggregateRating)
  const productWithRating = {
    ...product,
    averageRating: reviewData.average || product.averageRating,
    reviewCount: reviewData.count || product.reviewCount,
  };

  return (
    <>
      {/* Structured data — server-rendered, visible to Googlebot in initial HTML */}
      <ProductSchema product={productWithRating} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/shop' },
        ...(product.segment ? [{ name: product.segment, url: `/segment/${product.segment.toLowerCase()}` }] : []),
        { name: product.name },
      ]} />

      {/* Interactive client island — receives all pre-fetched data as props */}
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        initialReviewData={reviewData}
      />
    </>
  );
}
