import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { MAX_ITEMS } from '@/lib/orderIntegrity';

// POST /api/cart/validate  { items: [{ slug, size, quantity, price }] }
//
// The cart persists in localStorage indefinitely, so a customer can return
// days later to prices and stock that have since changed. Everything the UI
// showed — line prices, the subtotal, the "PLACE ORDER — ₹799" button — came
// from that stale copy, and the correction only happened server-side at
// submit. On COD that meant being told ₹799 and asked for ₹1099 at the door.
//
// This returns the current truth so the cart can reconcile and tell the
// customer what changed before they commit.
export async function POST(request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ items: [] });
    }
    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Too many items' }, { status: 400 });
    }

    await connectDB();

    const slugs = [...new Set(items.map((i) => i.slug || i.productSlug).filter(Boolean))];
    const products = await Product.find({ slug: { $in: slugs } })
      .select('slug name price mrp isActive sizes images')
      .lean();

    const bySlug = new Map(products.map((p) => [p.slug, p]));

    const results = items.map((i) => {
      const slug = i.slug || i.productSlug;
      const product = bySlug.get(slug);
      const quantity = Math.max(1, parseInt(i.quantity, 10) || 1);

      if (!product || !product.isActive) {
        return { slug, size: i.size, status: 'unavailable', name: i.name };
      }

      const sizeRow = (product.sizes || []).find((s) => s.size === i.size);
      const stock = sizeRow?.stock ?? 0;

      if (stock <= 0) {
        return { slug, size: i.size, status: 'out_of_stock', name: product.name };
      }
      if (stock < quantity) {
        return {
          slug,
          size: i.size,
          status: 'low_stock',
          name: product.name,
          availableQty: stock,
          price: product.price,
          mrp: product.mrp,
        };
      }
      if (Number(i.price) !== product.price) {
        return {
          slug,
          size: i.size,
          status: 'price_changed',
          name: product.name,
          oldPrice: Number(i.price),
          price: product.price,
          mrp: product.mrp,
        };
      }

      return { slug, size: i.size, status: 'ok', name: product.name, price: product.price, mrp: product.mrp };
    });

    return NextResponse.json({
      items: results,
      hasChanges: results.some((r) => r.status !== 'ok'),
    });
  } catch (error) {
    console.error('Cart validate error:', error);
    return NextResponse.json({ error: 'Could not check your bag' }, { status: 500 });
  }
}
