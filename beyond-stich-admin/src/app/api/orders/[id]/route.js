import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/orders/[id] — Fetch single order with full details
export async function GET(request, { params }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug segment images')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PUT /api/orders/[id] — Update order status / tracking
export async function PUT(request, { params }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Only allow updating specific fields
    const allowedUpdates = {};
    if (body.orderStatus) allowedUpdates.orderStatus = body.orderStatus;
    if (body.trackingNumber) allowedUpdates.trackingNumber = body.trackingNumber;
    if (body.notes) allowedUpdates.notes = body.notes;

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order UPDATE error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
