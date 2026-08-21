import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PendingOrder from '@/lib/models/PendingOrder';
import { MAX_ITEMS, OrderError, repriceItems, computeTotals } from '@/lib/orderIntegrity';

// POST /api/razorpay/order
// Creates a real Razorpay order and returns the order_id for the frontend checkout.
//
// The amount is computed here from the cart contents, never taken from the
// request. The client used to send its own `total`, which with live keys would
// let anyone open devtools and pay ₹1 for a ₹1099 tee — the gateway would
// happily collect whatever amount the order was created for.
export async function POST(request) {
  try {
    // email is needed so first-order-only coupons resolve the same way here
    // as they will at order time — otherwise the amount charged by the
    // gateway could differ from the amount recorded on the order.
    const {
      items,
      couponCode = '',
      email = '',
      // Kept alongside the cart so the webhook can build a complete order
      // without the browser.
      shippingAddress = null,
      currency = 'INR',
      notes = {},
    } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }
    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Too many items in one order' }, { status: 400 });
    }

    await connectDB();

    // Same pricing rules as /api/orders: DB prices, server-side coupon
    // validation, and shipping as a business rule.
    let pricedItems;
    try {
      pricedItems = await repriceItems(items);
    } catch (err) {
      if (err instanceof OrderError) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    }

    const { total } = await computeTotals(pricedItems, couponCode, email);

    // Razorpay rejects anything under 100 paise (₹1).
    if (!Number.isFinite(total) || total < 1) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If keys aren't configured, return a mock order so the UI can still be
    // exercised in development. Decided by server config only.
    if (!keyId || keyId === 'your_razorpay_key_id' || !keySecret) {
      return NextResponse.json({
        success: true,
        order: {
          id: `mock_order_${Math.floor(Math.random() * 1_000_000)}`,
          amount: Math.round(total * 100),
          currency,
          mock: true,
        },
      });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100), // Razorpay works in paise
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes,
    });

    // Stash the basket so the webhook can create the order if the customer's
    // browser never makes it back to /api/razorpay/verify — otherwise their
    // money is taken and no order exists. Razorpay's own `notes` field is far
    // too small to hold a cart.
    try {
      let userId = null;
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) userId = session.user.id;
      } catch {}

      await PendingOrder.create({
        razorpayOrderId: order.id,
        items,
        shippingAddress: shippingAddress || null,
        email,
        couponCode,
        user: userId,
      });
    } catch (err) {
      // Don't block checkout: the browser path still works, this only costs
      // us the webhook safety net for this one order.
      console.error('[razorpay/order] could not save pending order', order.id, err);
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('[razorpay/order] Error:', error);
    // A bad key surfaces as a 401 from Razorpay; pass that through so the
    // cause is obvious rather than a generic failure.
    const status = error?.statusCode === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: 'Payment initiation failed' },
      { status }
    );
  }
}
