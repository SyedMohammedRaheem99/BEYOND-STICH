import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';
import { SEGMENTS } from '@/lib/constants';
import { getAllPosts } from '@/lib/blog';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beyondstich.com';

  // Static routes
  const staticRoutes = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/faq',
    '/size-guide',
    '/shipping',
    '/returns',
    '/terms',
    '/privacy',
    '/stores/bangalore',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/shop' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : route === '/shop' ? 0.9 : 0.5,
  }));

  // Segment routes
  const segmentRoutes = SEGMENTS.map((s) => ({
    url: `${baseUrl}/segment/${s.name.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Fetch product slugs from MongoDB with fallback to dummy products
  let products = [];
  try {
    await connectDB();
    const docs = await Product.find({ isActive: true }).select('slug updatedAt').lean();
    if (docs.length > 0) {
      products = docs;
    }
  } catch {}

  if (products.length === 0) {
    products = DUMMY_PRODUCTS;
  }

  const productRoutes = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Blog routes
  const blogPosts = getAllPosts();
  const blogRoutes = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...segmentRoutes, ...productRoutes, ...blogRoutes];
}
