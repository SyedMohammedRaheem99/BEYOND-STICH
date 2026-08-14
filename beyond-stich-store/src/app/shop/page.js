import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';
import ShopClient from './ShopClient';

// Serve catalog pages from cache for 5 minutes. Without this every
// visit blocks on a MongoDB round trip before any HTML ships.
export const revalidate = 300;

export default async function ShopPage() {
  let products = [];

  try {
    await connectDB();
    // Only the fields ProductCard renders. Without this the full description,
    // material and viewCount of every product were serialised into the HTML.
    const docs = await Product.find({ isActive: true })
      .select('name slug price mrp images segment fitType colors sizes tags averageRating reviewCount createdAt')
      .sort({ createdAt: -1 })
      .lean();
    products = docs.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }));
  } catch {
    // Fallback to dummy data when DB is unavailable
    products = DUMMY_PRODUCTS.map((p) => ({
      ...p,
      _id: p._id || p.slug,
    }));
  }

  // ShopClient reads useSearchParams, so everything inside its Suspense
  // boundary is client-rendered — crawlers would otherwise get an empty page.
  // This server-rendered list puts the catalog and its links in the initial
  // HTML. It's visually hidden but readable by crawlers and screen readers.
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Drops | Beyond Stich',
    url: 'https://beyondstich.com/shop',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="sr-only">
        <h1>All Drops — Oversized Graphic Tees</h1>
        <ul>
          {products.map((p) => (
            <li key={p._id}>
              <a href={`/product/${p.slug}`}>
                {p.name} — ₹{p.price}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <Suspense fallback={null}>
        <ShopClient initialProducts={products} />
      </Suspense>
    </>
  );
}
