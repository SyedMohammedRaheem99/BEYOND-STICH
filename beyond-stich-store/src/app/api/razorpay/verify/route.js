import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import PendingOrder from '@/lib/models/PendingOrder';
import {
  MAX_ITEMS,
  OrderError,
  isValidEmail,
  validateShippingAddress,
  pickShippingAddress,
  repriceItems,
  computeTotals,
  reserveStock,
  releaseStock,
} from '@/lib/orderIntegrity';

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
    // Mock mode is decided by SERVER config only. It previously also triggered
    // on a client-supplied `mock_order_` prefix, which meant anyone could post
    // that prefix to skip verification and get a free order marked as paid.
    const isMock = !keySecret || keySecret === 'your_razorpay_key_secret';

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
    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Too many items in one order' }, { status: 400 });
    }

    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return NextResponse.json({ error: addressError }, { status: 400 });
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    await connectDB();

    // The webhook is racing this request. Whoever claims the pending cart
    // first creates the order; the other backs off. Without this a payment
    // could produce two orders and two stock reservations.
    if (!isMock && razorpay_order_id) {
      const alreadyPlaced = await Order.findOne({ razorpayOrderId: razorpay_order_id })
        .select('orderNumber createdAt total')
        .lean();
      if (alreadyPlaced) {
        return NextResponse.json({
          success: true,
          message: 'Payment already confirmed',
          order: {
            orderNumber: alreadyPlaced.orderNumber,
            createdAt: alreadyPlaced.createdAt,
            total: alreadyPlaced.total,
          },
        });
      }

      await PendingOrder.updateOne(
        { razorpayOrderId: razorpay_order_id },
        { $set: { consumed: true } }
      ).catch(() => {});
    }

    // Same integrity rules as /api/orders: prices, discount and shipping are
    // recomputed server-side and stock is reserved atomically. This route
    // previously wrote the client's own totals straight to the database.
    let pricedItems;
    try {
      pricedItems = await repriceItems(items);
    } catch (err) {
      if (err instanceof OrderError) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    }

    const {
      subtotal: serverSubtotal,
      discount: serverDiscount,
      shipping: serverShipping,
      total: serverTotal,
      appliedCouponCode,
    } = await computeTotals(pricedItems, couponCode, email);

    const soldOut = await reserveStock(pricedItems);
    if (soldOut) {
      return NextResponse.json(
        { error: `${soldOut.name} (${soldOut.size}) just sold out. Please review your cart.` },
        { status: 409 }
      );
    }

    let order;
    try {
      order = await Order.create({
        email: email || '',
        items: pricedItems,
        shippingAddress: pickShippingAddress(shippingAddress),
        subtotal: serverSubtotal,
        discount: serverDiscount,
        shipping: serverShipping,
        total: serverTotal,
        couponCode: appliedCouponCode,
        paymentMethod: isMock ? 'mock' : 'online',
        paymentId: razorpay_payment_id || '',
        razorpayOrderId: razorpay_order_id || '',
        paymentStatus: 'paid',
        orderStatus: 'placed',
      });
    } catch (err) {
      await releaseStock(pricedItems);
      throw err;
    }

    // Increment coupon usage. Only counts a coupon that actually applied.
    if (appliedCouponCode) {
      try {
        await Coupon.updateOne({ code: appliedCouponCode }, { $inc: { usedCount: 1 } });
      } catch (err) {
        console.error('[razorpay/verify] coupon usage increment failed', appliedCouponCode, err);
      }
    }

    // Stock was already reserved atomically above — no second decrement here.

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
