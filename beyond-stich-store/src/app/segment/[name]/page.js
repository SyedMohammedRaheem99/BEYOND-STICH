import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';
import { SEGMENTS } from '@/lib/constants';
import SegmentClient from './SegmentClient';

// Serve catalog pages from cache for 5 minutes. Without this every
// visit blocks on a MongoDB round trip before any HTML ships.
export const revalidate = 300;

export default async function SegmentWorldPage({ params }) {
  const { name } = await params;
  const segmentName = name?.toUpperCase();

  const segmentData = SEGMENTS.find((s) => s.name === segmentName);

  if (!segmentData) {
    notFound();
  }

  let products = [];

  try {
    await connectDB();
    // Only the fields ProductCard renders — see the same note in shop/page.js.
    const docs = await Product.find({ isActive: true, segment: segmentData.name })
      .select('name slug price mrp images segment fitType colors sizes tags averageRating reviewCount createdAt')
      .sort({ createdAt: -1 })
      .lean();
    products = docs.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }));
  } catch {
    // Fallback to dummy data filtered by segment
    products = DUMMY_PRODUCTS
      .filter((p) => p.segment === segmentData.name)
      .map((p) => ({
        ...p,
        _id: p._id || p.slug,
      }));
  }

  // CollectionPage / ItemList structured data for SEO
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${segmentData.name} Collection`,
    description: segmentData.description,
    url: `https://beyondstich.com/segment/${segmentData.id}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://beyondstich.com/product/${p.slug}`,
        name: p.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <SegmentClient segmentData={segmentData} initialProducts={products} />
    </>
  );
}
