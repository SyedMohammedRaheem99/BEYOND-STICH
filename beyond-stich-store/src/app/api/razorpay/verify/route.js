import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import Product from '@/lib/models/Product';

// POST /api/razorpay/verify
// 1. Verifies the HMAC signature from Razorpay (prevents spoofed payment success).
// 2. Creates (or updates) the order in MongoDB with paymentStatus: 'paid'.
// 3. Decrements product stock.
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Order data sent from checkout page
      items,
      shippingAddress,
      email,
      subtotal,
      discount = 0,
      shipping = 0,
      total,
      couponCode = '',
    } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // --- SIGNATURE VERIFICATION ---
    // Skip for mock orders (no real Razorpay keys configured or mock prefix)
    const isMock = !keySecret
      || keySecret === 'your_razorpay_key_secret'
      || (razorpay_order_id || '').startsWith('mock_order_');

    if (!isMock) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
      }

      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.error('[razorpay/verify] Signature mismatch! Possible spoofing attempt.');
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // --- ORDER PERSISTENCE ---
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!shippingAddress?.fullName || !shippingAddress?.pincode) {
      return NextResponse.json({ error: 'Shipping address is incomplete' }, { status: 400 });
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
      couponCode,
      paymentMethod: isMock ? 'mock' : 'online',
      paymentId: razorpay_payment_id || '',
      razorpayOrderId: razorpay_order_id || '',
      paymentStatus: 'paid',
      orderStatus: 'placed',
    });

    // Increment coupon usage (best-effort)
    if (couponCode) {
      try {
        await Coupon.updateOne({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
      } catch {}
    }

    // Decrement stock (best-effort — never block order confirmation)
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
      message: 'Payment verified and order placed!',
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        total: order.total,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[razorpay/verify] Error:', error);
    return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 500 });
  }
}
