import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { getAdminFromRequest } from '@/lib/auth';
import { sendShippingUpdate, sendRefundEmail } from '@/lib/email';

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

    // Refund fields
    if (body.refundAmount !== undefined) allowedUpdates.refundAmount = body.refundAmount;
    if (body.refundReason !== undefined) allowedUpdates.refundReason = body.refundReason;
    if (body.refundStatus && ['none', 'pending', 'processed', 'failed'].includes(body.refundStatus)) {
      allowedUpdates.refundStatus = body.refundStatus;
      if (body.refundStatus === 'pending') {
        allowedUpdates.refundInitiatedAt = new Date();
      }
      if (body.refundStatus === 'processed') {
        allowedUpdates.paymentStatus = 'refunded';
      }
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Send shipping email when status changes to shipped
    if (allowedUpdates.orderStatus === 'shipped') {
      sendShippingUpdate(order).catch(() => {});
    }

    // Send refund email when refund is processed
    if (allowedUpdates.refundStatus === 'processed') {
      sendRefundEmail(order).catch(() => {});
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order UPDATE error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
