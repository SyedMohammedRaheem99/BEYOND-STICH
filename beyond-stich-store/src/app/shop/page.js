import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';
import { serialiseProducts } from '@/lib/serialise';
import { getBanners } from '@/lib/homeSections';
import { getSegments } from '@/lib/segments';
import ShopClient from './ShopClient';

// Serve catalog pages from cache for 5 minutes. Without this every
// visit blocks on a MongoDB round trip before any HTML ships.
export const revalidate = 300;

export default async function ShopPage() {
  let products = [];

  // Admin-managed promo slides. getBanners() fails soft to [], and
  // ShopBanner falls back to its built-in slides, so a database problem
  // costs the editable copy but never the page.
  const [banners, segments] = await Promise.all([
    getBanners('shop-hero'),
    getSegments(),
  ]);

  try {
    await connectDB();
    // Only the fields ProductCard renders. Without this the full description,
    // material and viewCount of every product were serialised into the HTML.
    const docs = await Product.find({ isActive: true })
      .select('name slug price mrp images segment productType fitType colors sizes tags averageRating reviewCount createdAt')
      .sort({ createdAt: -1 })
      .lean();
    // createdAt is selected above and is a Date, which React will not pass
    // to a Client Component — converting only _id left the warning in place.
    products = serialiseProducts(docs);
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

      {/* ShopHero was removed: it rendered the same drops-1 artwork as the
          promo carousel immediately below it, so the page opened with the
          identical concrete-showroom photo twice and read as a loading
          glitch. The carousel is the hero now.

          The H1 stays here, server-rendered, rather than moving into the
          carousel — ShopClient is a client component behind Suspense, so an
          H1 inside it would not be in the initial HTML for a crawler. It is
          visually hidden because the carousel states the page visually. */}
      <h1 className="sr-only">
        All Drops — Premium Oversized Graphic Tees | Beyond Stich
      </h1>

      <div className="sr-only">
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
        <ShopClient initialProducts={products} banners={banners} segments={segments} />
      </Suspense>
    </>
  );
}
