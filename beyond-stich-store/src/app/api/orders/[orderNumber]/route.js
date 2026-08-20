import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

// GET /api/orders/[orderNumber]
// Full detail for one of the signed-in customer's own orders.
//
// Scoped by identity, never by the URL alone: an order is returned only if it
// belongs to this account (by user id, or by the account's email for orders
// placed as a guest before signing up).
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderNumber } = await params;
    if (typeof orderNumber !== 'string' || !orderNumber.trim()) {
      return NextResponse.json({ error: 'Invalid order number' }, { status: 400 });
    }

    await connectDB();

    const account = await User.findById(session.user.id).select('email').lean();
    const identity = [{ user: session.user.id }];
    if (account?.email) identity.push({ email: account.email.toLowerCase() });

    const order = await Order.findOne({
      orderNumber: orderNumber.trim().toUpperCase(),
      $or: identity,
    }).lean();

    // Same response whether the order doesn't exist or isn't theirs, so this
    // can't be used to probe for valid order numbers.
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      order: { ...order, _id: order._id.toString(), user: order.user?.toString() || null },
    });
  } catch (error) {
    console.error('Order detail error:', error);
    return NextResponse.json({ error: 'Could not load that order' }, { status: 500 });
  }
}
