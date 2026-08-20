import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

// The policy stated on /returns.
const RETURN_WINDOW_DAYS = 7;

// POST /api/orders/[orderNumber]/return  { reason }
// Lets a customer raise a return request themselves. The admin panel already
// had refund fields, but nothing on the customer side could start the process
// — it was entirely manual over WhatsApp.
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderNumber } = await params;
    const { reason } = await request.json();

    if (typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please tell us briefly what went wrong (at least 10 characters).' },
        { status: 400 }
      );
    }

    const wait = rateLimit('return-request', clientKey(request), 10, 60 * 60 * 1000);
    if (wait) return tooManyRequests(wait);

    await connectDB();

    const account = await User.findById(session.user.id).select('email').lean();
    const identity = [{ user: session.user.id }];
    if (account?.email) identity.push({ email: account.email.toLowerCase() });

    const order = await Order.findOne({
      orderNumber: String(orderNumber).trim().toUpperCase(),
      $or: identity,
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.orderStatus !== 'delivered') {
      return NextResponse.json(
        { error: 'You can raise a return once the order has been delivered.' },
        { status: 409 }
      );
    }

    if (order.returnRequest?.status && order.returnRequest.status !== 'none') {
      return NextResponse.json(
        { error: 'A return has already been raised for this order.' },
        { status: 409 }
      );
    }

    // Enforce the 7-day window from delivery. Older orders predate the
    // deliveredAt field, so fall back to the last update.
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / 86_400_000;
    if (daysSince > RETURN_WINDOW_DAYS) {
      return NextResponse.json(
        { error: `Returns are accepted within ${RETURN_WINDOW_DAYS} days of delivery.` },
        { status: 409 }
      );
    }

    order.returnRequest = {
      status: 'requested',
      reason: reason.trim().slice(0, 500),
      requestedAt: new Date(),
      resolvedAt: null,
    };
    await order.save();

    return NextResponse.json({
      message: "Return raised. We'll be in touch within 24 hours.",
      returnRequest: order.returnRequest,
    });
  } catch (error) {
    console.error('Return request error:', error);
    return NextResponse.json({ error: 'Could not raise the return' }, { status: 500 });
  }
}
