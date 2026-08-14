import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';

export async function generateMetadata({ params }) {
  const { slug } = await params;

  // Mirror getProduct() in page.js: if the database answers, its answer is
  // final. Falling back to seed data on a miss would give a nonexistent
  // product real metadata and a canonical URL.
  let product = null;
  try {
    await connectDB();
    const doc = await Product.findOne({ slug, isActive: true }).lean();
    if (doc) product = { ...doc, _id: doc._id.toString() };
  } catch {
    product = DUMMY_PRODUCTS.find((p) => p.slug === slug) || null;
  }

  if (!product) {
    return {
      title: 'Product Not Found | Beyond Stich',
      robots: { index: false, follow: false },
    };
  }
  
  const canonical = `https://beyondstich.com/product/${slug}`;

  return {
    title: `${product.name} | Beyond Stich`,
    description: product.description || `Buy ${product.name} at Beyond Stich. Premium oversized graphic tees for men.`,
    alternates: { canonical },
    openGraph: {
      title: `${product.name} | Beyond Stich`,
      description: product.description || `Buy ${product.name} at Beyond Stich. Premium oversized graphic tees for men.`,
      url: canonical,
      images: [
        {
          url: product.images?.[0] || '/banners/og/og-default.jpg',
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Beyond Stich`,
      description: product.description,
      images: [product.images?.[0] || '/banners/og/og-default.jpg'],
    },
  };
}

export default function ProductLayout({ children }) {
  return children;
}
