import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';

// POST /api/orders/track  { orderNumber, contact }
// Guest order lookup. Requires the order number AND the email or phone used at
// checkout, so orders can't be enumerated by number alone.
export async function POST(request) {
  try {
    const { orderNumber, contact } = await request.json();

    if (!orderNumber?.trim() || !contact?.trim()) {
      return NextResponse.json({ error: 'Enter your order number and email or phone' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).lean();

    // Verify the contact matches (email OR phone) — same response for "not found"
    // and "wrong contact" so existence isn't leaked.
    const c = contact.trim().toLowerCase();
    const digits = contact.replace(/\D/g, '');
    const emailMatch = order?.email && order.email === c;
    const phoneMatch =
      order?.shippingAddress?.phone &&
      digits.length >= 6 &&
      order.shippingAddress.phone.replace(/\D/g, '') === digits;

    if (!order || !(emailMatch || phoneMatch)) {
      return NextResponse.json({ found: false, message: "We couldn't find an order matching those details." });
    }

    return NextResponse.json({
      found: true,
      order: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        total: order.total,
        trackingNumber: order.trackingNumber || '',
        items: (order.items || []).map((i) => ({
          name: i.name, size: i.size, color: i.color, quantity: i.quantity, image: i.image, segment: i.segment,
        })),
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
      },
    });
  } catch (error) {
    console.error('Order track error:', error);
    return NextResponse.json({ error: 'Could not look up your order right now.' }, { status: 500 });
  }
}
