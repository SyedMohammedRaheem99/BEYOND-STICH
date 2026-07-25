import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/products — Fetch all products
export async function GET(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // 'in_stock' | 'low_stock' | 'out_of_stock'

    let query = {};

    if (segment && segment !== 'all') {
      query.segment = segment.toUpperCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Apply stock status filter after fetch (virtual fields don't work in queries)
    let filtered = products;
    if (status === 'out_of_stock') {
      filtered = products.filter(p => p.sizes.every(s => s.stock === 0));
    } else if (status === 'low_stock') {
      filtered = products.filter(p => {
        const total = p.sizes.reduce((sum, s) => sum + s.stock, 0);
        return total > 0 && total <= 10;
      });
    } else if (status === 'in_stock') {
      filtered = products.filter(p => {
        const total = p.sizes.reduce((sum, s) => sum + s.stock, 0);
        return total > 10;
      });
    }

    return NextResponse.json({ products: filtered, count: filtered.length });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products — Create a new product
export async function POST(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const body = await request.json();

    // Auto-generate slug from name if not provided
    if (!body.slug && body.name) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const product = await Product.create(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Product CREATE error:', error);

    if (error.code === 11000) {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
