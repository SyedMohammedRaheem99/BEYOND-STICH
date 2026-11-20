import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { getAdminFromRequest } from '@/lib/auth';
import {
  sendShippingUpdate,
  sendRefundEmail,
  sendOrderCancelled,
  sendReturnUpdate,
} from '@/lib/email';
import { canTransition, transitionError, shouldRestoreStock } from '@/lib/orderFlow';
import { restoreStock } from '@/lib/stock';

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

    // Read the order first: every rule below depends on where it is NOW, and
    // findByIdAndUpdate would overwrite that before it could be checked.
    const current = await Order.findById(id);
    if (!current) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow updating specific fields
    const allowedUpdates = {};
    if (body.orderStatus) {
      // Enforced here rather than only in the UI: this endpoint is reachable
      // directly, and the dropdown used to offer all seven statuses from any
      // state — so a delivered order could be cancelled, a cancelled order
      // un-cancelled, and an order marked delivered having never shipped.
      if (!canTransition(current.orderStatus, body.orderStatus)) {
        return NextResponse.json(
          {
            error: transitionError(current.orderStatus, body.orderStatus),
            currentStatus: current.orderStatus,
          },
          { status: 409 }
        );
      }

      allowedUpdates.orderStatus = body.orderStatus;
      // Stamp the delivery date: the customer's 7-day return window runs from
      // here, and without it there's nothing to measure against.
      if (body.orderStatus === 'delivered') allowedUpdates.deliveredAt = new Date();
    }
    // Let the owner action a customer's return request.
    if (
      body.returnStatus &&
      ['none', 'requested', 'approved', 'rejected', 'completed'].includes(body.returnStatus)
    ) {
      allowedUpdates['returnRequest.status'] = body.returnStatus;
      if (['approved', 'rejected', 'completed'].includes(body.returnStatus)) {
        allowedUpdates['returnRequest.resolvedAt'] = new Date();
      }
      // Completing a return means the goods are physically back. The order
      // status has to follow, or the order stays 'delivered' forever while
      // its return reads 'completed' — and the stock is never restored
      // because that is driven by the orderStatus change below.
      if (
        body.returnStatus === 'completed' &&
        !body.orderStatus &&
        canTransition(current.orderStatus, 'returned')
      ) {
        allowedUpdates.orderStatus = 'returned';
      }
    }
    // Compare against undefined, not truthiness: a truthiness check meant an
    // empty string was silently dropped, so a wrong tracking number could
    // never be cleared — the save appeared to work and the stale number
    // (already emailed to the customer) came back on reload.
    if (body.trackingNumber !== undefined) allowedUpdates.trackingNumber = body.trackingNumber;
    if (body.notes !== undefined) allowedUpdates.notes = body.notes;
    // COD is settled on delivery, so the owner needs a way to record it —
    // without this no COD order ever becomes 'paid' and all revenue
    // reporting reads zero.
    if (body.paymentStatus && ['pending', 'paid', 'failed', 'refunded'].includes(body.paymentStatus)) {
      allowedUpdates.paymentStatus = body.paymentStatus;
    }

    // Refund fields
    if (body.refundAmount !== undefined) {
      const amount = Number(body.refundAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: 'Refund amount must be a positive number' }, { status: 400 });
      }
      // Nothing capped this before, so a typo could record a refund larger
      // than the order was ever worth and corrupt the revenue figures.
      if (amount > current.total) {
        return NextResponse.json(
          { error: `Refund cannot exceed the order total of ₹${current.total}.` },
          { status: 400 }
        );
      }
      allowedUpdates.refundAmount = amount;
    }
    if (body.refundReason !== undefined) {
      allowedUpdates.refundReason = String(body.refundReason).slice(0, 500);
    }
    if (body.refundStatus && ['none', 'pending', 'processed', 'failed'].includes(body.refundStatus)) {
      // Marking a refund processed emails the customer that their money is
      // on the way, so it needs a recorded reason — otherwise there is no
      // way to reconstruct why a refund was issued.
      if (body.refundStatus === 'processed') {
        const reason = allowedUpdates.refundReason ?? current.refundReason;
        if (!reason || !String(reason).trim()) {
          return NextResponse.json(
            { error: 'Add a refund reason before marking it processed.' },
            { status: 400 }
          );
        }
      }

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

    // Put the units back on the shelf when an order ends in cancellation or
    // a return. Driven off the transition rather than the destination, so
    // re-saving an already-cancelled order can't restore the same stock
    // twice — `current.orderStatus` is the status before this write.
    let stockRestored = 0;
    if (
      allowedUpdates.orderStatus &&
      shouldRestoreStock(current.orderStatus, allowedUpdates.orderStatus)
    ) {
      const result = await restoreStock(order.items);
      stockRestored = result.restored;
      console.log(
        `[orders] ${order.orderNumber} ${current.orderStatus} → ${allowedUpdates.orderStatus}:`,
        `restored ${result.restored} unit(s)`
      );
    }

    // Send shipping email when status changes to shipped
    if (allowedUpdates.orderStatus === 'shipped') {
      sendShippingUpdate(order).catch((e) =>
        console.error('[orders] shipping email failed', order.orderNumber, e)
      );
    }

    // Tell the customer their order was cancelled. Previously this happened
    // silently — the order simply vanished from their account with no
    // explanation, which turns into a support message every time.
    if (allowedUpdates.orderStatus === 'cancelled') {
      sendOrderCancelled(order).catch((e) =>
        console.error('[orders] cancellation email failed', order.orderNumber, e)
      );
    }

    // Tell the customer the outcome of a return they raised. The storefront
    // promises "we'll be in touch within 24 hours" when they submit one, and
    // nothing was ever sent — so the only way to learn the decision was to
    // ask.
    if (['approved', 'rejected', 'completed'].includes(body.returnStatus)) {
      sendReturnUpdate(order, body.returnStatus).catch((e) =>
        console.error('[orders] return email failed', order.orderNumber, e)
      );
    }

    // Send refund email when refund is processed
    if (allowedUpdates.refundStatus === 'processed') {
      sendRefundEmail(order).catch((e) =>
        console.error('[orders] refund email failed', order.orderNumber, e)
      );
    }

    return NextResponse.json({ order, stockRestored });
  } catch (error) {
    console.error('Order UPDATE error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
