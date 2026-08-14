import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';

const SORT_MAP = {
  newest: { createdAt: -1 },
  'price-low': { price: 1 },
  'price-high': { price: -1 },
  rating: { averageRating: -1 },
  discount: { price: 1 },
};

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
    if (featured === 'true') filter.tags = 'featured';

    const sortObj = SORT_MAP[sort] || { createdAt: -1 };
    let query = Product.find(filter).sort(sortObj);
    if (limit > 0) query = query.limit(limit);

    const docs = await query.lean();
    if (docs.length > 0) {
      return NextResponse.json(docs.map(d => ({ ...d, _id: d._id.toString() })));
    }

    // Fallback to dummy data
    return NextResponse.json(getDummyFallback({ segment, tag, sort, featured, limit }));
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
