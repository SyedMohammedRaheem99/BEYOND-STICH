import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';
import { DUMMY_PRODUCTS, DUMMY_REVIEWS } from '@/lib/dummyData';
import ProductSchema from '@/components/seo/ProductSchema';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import ProductDetailClient from './ProductDetailClient';

// Server-side product fetch (direct DB, no HTTP round-trip)
async function getProduct(slug) {
  try {
    await connectDB();
    const doc = await Product.findOne({ slug, isActive: true }).lean();
    if (doc) return { ...doc, _id: doc._id.toString() };
  } catch {}
  return DUMMY_PRODUCTS.find((p) => p.slug === slug) || null;
}

// Server-side related products fetch
async function getRelated(slug, segment) {
  try {
    await connectDB();
    const docs = await Product.find({ segment, slug: { $ne: slug }, isActive: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    if (docs.length > 0) return docs.map((d) => ({ ...d, _id: d._id.toString() }));
  } catch {}
  return DUMMY_PRODUCTS.filter((p) => p.segment === segment && p.slug !== slug).slice(0, 4);
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
  } catch {}
  // Fallback: dummy reviews keyed by product._id
  const dummyProduct = DUMMY_PRODUCTS.find((p) => p.slug === slug);
  const dummyProductReviews = dummyProduct ? (DUMMY_REVIEWS?.[dummyProduct._id] || []) : [];
  const count = dummyProductReviews.length;
  const average = count
    ? Math.round((dummyProductReviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of dummyProductReviews) distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  return { reviews: dummyProductReviews, average, count, distribution };
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
