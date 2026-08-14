import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import Product from '@/lib/models/Product';
import { sendOrderConfirmation } from '@/lib/email';

// GET /api/orders — fetch orders for the logged-in user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;

    const orders = await Order.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders — create an order (guest or logged-in checkout).
// NOTE: payment is still mocked (paymentMethod: 'mock', paymentStatus: 'pending').
// When real Razorpay lands, verify the signature here before creating the order
// and set paymentStatus: 'paid'.
export async function POST(request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, email, subtotal, discount = 0, shipping = 0, total, couponCode, paymentMethod: reqPaymentMethod } = body;

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

    // Attach user if logged in
    let userId = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) userId = session.user.id;
    } catch {}

    // Re-price every line from the database. The client sends prices, but a
    // tampered request could otherwise buy a ₹799 tee for ₹1 — especially on
    // COD, where no payment gateway re-checks the amount. Products that only
    // exist in the local seed fall back to the submitted price.
    const pricedItems = await Promise.all(
      items.map(async (i) => {
        const slug = i.productSlug || i.slug || '';
        const quantity = Math.max(1, parseInt(i.quantity, 10) || 1);
        let price = Number(i.price) || 0;

        if (slug) {
          try {
            const dbProduct = await Product.findOne({ slug }).select('price').lean();
            if (dbProduct && typeof dbProduct.price === 'number') price = dbProduct.price;
          } catch {}
        }

        return {
          productSlug: slug,
          name: i.name,
          image: i.image || '',
          size: i.size || '',
          color: i.color || '',
          segment: i.segment || '',
          quantity,
          price,
        };
      })
    );

    const serverSubtotal = pricedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Never let a client-supplied discount exceed the real subtotal.
    const serverDiscount = Math.min(Math.max(Number(discount) || 0, 0), serverSubtotal);
    const serverShipping = Math.max(Number(shipping) || 0, 0);
    const serverTotal = serverSubtotal - serverDiscount + serverShipping;

    const order = await Order.create({
      user: userId,
      email: email || '',
      items: pricedItems,
      shippingAddress,
      subtotal: serverSubtotal,
      discount: serverDiscount,
      shipping: serverShipping,
      total: serverTotal,
      couponCode: couponCode || '',
      paymentMethod: reqPaymentMethod || 'mock',
      paymentStatus: reqPaymentMethod === 'cod' ? 'pending' : 'paid',
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

    // Send confirmation email (fire-and-forget, don't block response)
    if (order.email) {
      sendOrderConfirmation(order).catch(() => {});
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
