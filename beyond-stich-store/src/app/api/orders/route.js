import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import Product from '@/lib/models/Product';

// POST /api/orders — create an order (guest checkout).
// NOTE: payment is still mocked (paymentMethod: 'mock', paymentStatus: 'pending').
// When real Razorpay lands, verify the signature here before creating the order
// and set paymentStatus: 'paid'.
export async function POST(request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, email, subtotal, discount = 0, shipping = 0, total, couponCode } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }
    if (!shippingAddress?.fullName || !shippingAddress?.pincode) {
      return NextResponse.json({ error: 'Shipping address is incomplete' }, { status: 400 });
    }
    if (typeof total !== 'number') {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.create({
      email: email || '',
      items: items.map((i) => ({
        productSlug: i.productSlug || i.slug || '',
        name: i.name,
        image: i.image || '',
        size: i.size || '',
        color: i.color || '',
        segment: i.segment || '',
        quantity: i.quantity,
        price: i.price,
      })),
      shippingAddress,
      subtotal,
      discount,
      shipping,
      total,
      couponCode: couponCode || '',
      paymentMethod: 'mock',
      // The mock checkout always "succeeds", so the order counts as paid (this
      // is what makes it show in dashboard revenue). When real Razorpay lands,
      // set this to 'paid' only after verifying the payment signature; COD
      // orders would stay 'pending' until delivery.
      paymentStatus: 'paid',
      orderStatus: 'placed',
    });

    // Increment coupon usage (best-effort).
    if (couponCode) {
      try {
        await Coupon.updateOne({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
      } catch {}
    }

    // Decrement stock for any items that exist as real DB products (no-op for
    // local seed products). Best-effort so an order is never blocked by this.
    for (const i of order.items) {
      if (!i.productSlug) continue;
      try {
        await Product.updateOne(
          { slug: i.productSlug, 'sizes.size': i.size },
          { $inc: { 'sizes.$.stock': -i.quantity } }
        );
      } catch {}
    }

    return NextResponse.json({
      success: true,
      order: { orderNumber: order.orderNumber, createdAt: order.createdAt, total: order.total },
    }, { status: 201 });
  } catch (error) {
    console.error('Order CREATE error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
