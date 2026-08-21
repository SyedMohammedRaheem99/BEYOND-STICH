import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import PendingOrder from '@/lib/models/PendingOrder';
import { sendOrderConfirmation, sendNewOrderAlert } from '@/lib/email';
import {
  pickShippingAddress,
  repriceItems,
  computeTotals,
  reserveStock,
  releaseStock,
} from '@/lib/orderIntegrity';

/**
 * POST /api/razorpay/webhook
 *
 * Razorpay calls this server-to-server when a payment succeeds. It is the
 * safety net for the case the browser can't cover: a customer pays, then
 * loses connection (or closes the tab) before /api/razorpay/verify runs. On
 * that path the money is taken and no order exists — the customer has paid
 * and has nothing to show for it.
 *
 * Set the endpoint in Razorpay Dashboard → Settings → Webhooks, subscribe to
 * `payment.captured`, and put the signing secret in RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request) {
  try {
    // The signature is computed over the exact bytes Razorpay sent, so the
    // raw body is required — re-serialising parsed JSON would change key
    // order and whitespace and every signature would fail.
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not set');
      // 200 so Razorpay stops retrying a request we can never process.
      return NextResponse.json({ ignored: 'not configured' });
    }

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    // timingSafeEqual throws on length mismatch, so check that first.
    const valid =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

    if (!valid) {
      console.error('[razorpay/webhook] Invalid signature — ignoring.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Only act on a captured payment. Razorpay may send others depending on
    // what's subscribed; acknowledge them so they aren't retried.
    if (event.event !== 'payment.captured') {
      return NextResponse.json({ ignored: event.event });
    }

    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const paymentId = payment?.id;

    if (!razorpayOrderId || !paymentId) {
      return NextResponse.json({ ignored: 'missing ids' });
    }

    await connectDB();

    // If the browser already completed this, we're done. Checking the Order
    // collection directly (not just the pending flag) means a retry after a
    // successful run can't duplicate anything.
    const existing = await Order.findOne({ razorpayOrderId }).select('_id').lean();
    if (existing) {
      return NextResponse.json({ ok: true, note: 'order already exists' });
    }

    // Claim the pending cart atomically. If the browser's verify call is
    // running concurrently, exactly one of the two wins this update.
    const pending = await PendingOrder.findOneAndUpdate(
      { razorpayOrderId, consumed: false },
      { $set: { consumed: true } },
      { new: true }
    );

    if (!pending) {
      // Either the browser claimed it, or the record expired. The order-exists
      // check above already covers the common case.
      console.warn('[razorpay/webhook] no pending cart for', razorpayOrderId);
      return NextResponse.json({ ok: true, note: 'nothing pending' });
    }

    let pricedItems;
    try {
      pricedItems = await repriceItems(pending.items);
    } catch (err) {
      // The customer has already paid, so this must not fail silently — it
      // needs manual attention (refund or manual fulfilment).
      console.error(
        '[razorpay/webhook] PAID BUT UNFULFILLABLE — payment',
        paymentId,
        'order',
        razorpayOrderId,
        err.message
      );
      return NextResponse.json({ ok: true, note: 'needs manual review' });
    }

    const {
      subtotal,
      discount,
      shipping,
      total,
      appliedCouponCode,
    } = await computeTotals(pricedItems, pending.couponCode, pending.email);

    const soldOut = await reserveStock(pricedItems);
    if (soldOut) {
      console.error(
        '[razorpay/webhook] PAID BUT OUT OF STOCK — payment',
        paymentId,
        `${soldOut.name} (${soldOut.size})`
      );
      return NextResponse.json({ ok: true, note: 'paid but out of stock' });
    }

    let order;
    try {
      order = await Order.create({
        user: pending.user || null,
        email: pending.email || '',
        items: pricedItems,
        shippingAddress: pickShippingAddress(pending.shippingAddress || {}),
        subtotal,
        discount,
        shipping,
        total,
        couponCode: appliedCouponCode,
        paymentMethod: 'online',
        paymentId,
        razorpayOrderId,
        paymentStatus: 'paid',
        orderStatus: 'placed',
      });
    } catch (err) {
      await releaseStock(pricedItems);
      throw err;
    }

    if (appliedCouponCode) {
      Coupon.updateOne({ code: appliedCouponCode }, { $inc: { usedCount: 1 } }).catch((e) =>
        console.error('[razorpay/webhook] coupon increment failed', e)
      );
    }

    if (order.email) {
      sendOrderConfirmation(order).catch((e) =>
        console.error('[razorpay/webhook] confirmation email failed', order.orderNumber, e)
      );
    }
    sendNewOrderAlert(order).catch((e) =>
      console.error('[razorpay/webhook] admin alert failed', order.orderNumber, e)
    );

    console.log('[razorpay/webhook] recovered order', order.orderNumber, 'from', paymentId);
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  } catch (error) {
    console.error('[razorpay/webhook] Error:', error);
    // 500 tells Razorpay to retry, which is what we want for a transient fault.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
