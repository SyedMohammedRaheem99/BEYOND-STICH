import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';

const SORT_MAP = {
  newest: { createdAt: -1 },
  'price-low': { price: 1 },
  'price-high': { price: -1 },
  rating: { averageRating: -1 },
  // 'discount' can't be expressed as a field sort — it's derived from mrp vs
  // price — so it's applied in memory below. Mapping it to { price: 1 } meant
  // "Biggest Discount" actually sorted cheapest-first: a ₹499 tee at 10% off
  // ranked above a ₹1299 tee at 60% off.
  discount: { createdAt: -1 },
};

const discountPercent = (p) =>
  p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const segment = searchParams.get('segment');
  const tag = searchParams.get('tag');
  const sort = searchParams.get('sort') || 'newest';
  const slug = searchParams.get('slug');
  const featured = searchParams.get('featured');
  const limit = parseInt(searchParams.get('limit') || '0', 10);
  const related = searchParams.get('related'); // slug of product to find related for

  try {
    await connectDB();

    // Single product by slug
    if (slug) {
      const product = await Product.findOne({ slug, isActive: true }).lean();
      if (product) {
        return NextResponse.json({ ...product, _id: product._id.toString() });
      }
      // Fallback to dummy data for single product
      const dummyProduct = DUMMY_PRODUCTS.find((p) => p.slug === slug);
      if (dummyProduct) {
        return NextResponse.json(dummyProduct);
      }
      return NextResponse.json(null, { status: 404 });
    }

    // Related products
    if (related) {
      const source = await Product.findOne({ slug: related, isActive: true }).lean();
      let docs = [];
      if (source) {
        docs = await Product.find({
          segment: source.segment,
          slug: { $ne: related },
          isActive: true,
        }).sort({ createdAt: -1 }).limit(limit || 4).lean();
      }
      if (docs.length > 0) {
        return NextResponse.json(docs.map(d => ({ ...d, _id: d._id.toString() })));
      }
      
      // Fallback to dummy data for related products
      const dummySource = DUMMY_PRODUCTS.find((p) => p.slug === related);
      if (dummySource) {
        let relatedDummy = DUMMY_PRODUCTS.filter(p => p.segment === dummySource.segment && p.slug !== related);
        return NextResponse.json(relatedDummy.slice(0, limit || 4));
      }
      return NextResponse.json([]);
    }

    // Build filter
    const filter = { isActive: true };
    if (segment && segment !== 'ALL') filter.segment = segment;
    if (tag) filter.tags = tag;
    // 'featured' is a tag here but a boolean in the seed data, and no product
    // actually carries the tag — so this always matched nothing and fell
    // through to seed products. Match either representation.
    if (featured === 'true') {
      filter.$or = [{ tags: 'featured' }, { featured: true }];
    }

    const sortObj = SORT_MAP[sort] || { createdAt: -1 };
    // Cap the response: this is public and unauthenticated, and without a
    // limit it serialised the entire catalogue on every call.
    const cap = limit > 0 ? Math.min(limit, 100) : 48;
    const docs = await Product.find(filter)
      .select('name slug price mrp images segment fitType colors sizes tags averageRating reviewCount featured createdAt')
      .sort(sortObj)
      .limit(cap)
      .lean();

    // An empty result is a valid answer from a healthy database. Falling back
    // to seed data here made the cart drawer cross-sell tees that aren't for
    // sale, linking to slugs that 404.
    const result = docs.map(d => ({ ...d, _id: d._id.toString() }));
    if (sort === 'discount') {
      result.sort((a, b) => discountPercent(b) - discountPercent(a));
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/products] DB error, using fallback:', err.message);
    return NextResponse.json(getDummyFallback({ segment, tag, sort, featured, limit }));
  }
}

function getDummyFallback({ segment, tag, sort, featured, limit }) {
  let list = [...DUMMY_PRODUCTS];
  if (segment && segment !== 'ALL') list = list.filter(p => p.segment === segment);
  if (tag) list = list.filter(p => p.tags?.includes(tag));
  if (featured === 'true') list = list.filter(p => p.featured);

  const sorters = {
    newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    rating: (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
  };
  if (sort && sorters[sort]) list.sort(sorters[sort]);
  if (limit > 0) list = list.slice(0, limit);
  return list;
}
