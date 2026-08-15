import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Coupon from '@/lib/models/Coupon';
import { sendOrderConfirmation } from '@/lib/email';
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

    // Match on email as well as user id. Orders placed before signing in — or
    // whenever the session cookie didn't ride along with the POST — have
    // user: null, and matching on id alone made them permanently invisible
    // here. The customer sees "no orders yet" for an order they just placed.
    const account = await User.findById(session.user.id).select('email').lean();
    const identity = [{ user: session.user.id }];
    if (account?.email) identity.push({ email: account.email.toLowerCase() });

    const orders = await Order.find({ $or: identity })
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
    // Cap basket size: each line costs a DB lookup plus a stock update, so an
    // oversized payload would otherwise tie up the connection pool.
    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Too many items in one order' }, { status: 400 });
    }

    // Server-side address validation. The checkout page validates too, but the
    // API is reachable directly — and an unreachable phone or a malformed
    // pincode means a COD parcel that can't be delivered and can't be traced
    // back to a customer, at our cost.
    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return NextResponse.json({ error: addressError }, { status: 400 });
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    await connectDB();

    // Attach user if logged in
    let userId = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) userId = session.user.id;
    } catch {}

    // Re-price and stock-check every line against the database (see
    // src/lib/orderIntegrity.js). The client sends prices, but a tampered
    // request could otherwise buy a ₹799 tee for ₹1 — especially on COD,
    // where no payment gateway re-checks the amount.
    let pricedItems;
    try {
      pricedItems = await repriceItems(items);
    } catch (err) {
      if (err instanceof OrderError) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    }

    // Discounts and shipping are business rules, never client inputs.
    const {
      subtotal: serverSubtotal,
      discount: serverDiscount,
      shipping: serverShipping,
      total: serverTotal,
      appliedCouponCode,
    } = await computeTotals(pricedItems, couponCode);

    // Reserve stock BEFORE creating the order so concurrent checkouts for the
    // last tee can't both succeed.
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
        user: userId,
        email: email || '',
        items: pricedItems,
        shippingAddress: pickShippingAddress(shippingAddress),
        subtotal: serverSubtotal,
        discount: serverDiscount,
        shipping: serverShipping,
        total: serverTotal,
        couponCode: appliedCouponCode,
        paymentMethod: reqPaymentMethod || 'mock',
        // Never mark an order paid here. This route takes no payment: real
        // online payments are confirmed in /api/razorpay/verify after the
        // signature check. Trusting the client's paymentMethod meant an
        // "online" order was recorded as paid without a rupee changing hands.
        paymentStatus: 'pending',
        orderStatus: 'placed',
      });
    } catch (err) {
      // Don't strand the reserved stock if the order write fails.
      await releaseStock(pricedItems);
      throw err;
    }

    // Increment coupon usage. Only counts a coupon that actually applied.
    if (appliedCouponCode) {
      try {
        await Coupon.updateOne({ code: appliedCouponCode }, { $inc: { usedCount: 1 } });
      } catch (err) {
        console.error('[orders] coupon usage increment failed', appliedCouponCode, err);
      }
    }

    // Send confirmation email (fire-and-forget, don't block response)
    if (order.email) {
      sendOrderConfirmation(order).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      // Return the authoritative money values so the confirmation page shows
      // what was actually recorded, not the cart's possibly-stale figures.
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shipping,
        total: order.total,
        couponCode: order.couponCode || null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Order CREATE error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
