import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DeliveryZone from '@/lib/models/DeliveryZone';
import { getAdminFromRequest } from '@/lib/auth';

const ZONES = ['local', 'nearby', 'rest'];
const orNull = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

// PUT /api/delivery/[id] — edit an area
export async function PUT(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const current = await DeliveryZone.findById(id);
    if (!current) {
      return NextResponse.json({ error: 'Delivery area not found' }, { status: 404 });
    }

    const update = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: 'Area name is required' }, { status: 400 });
      update.name = name;
    }

    // Validated against the saved values, so editing one end of a range
    // can't silently produce an inverted range.
    const start = body.rangeStart !== undefined ? Number(body.rangeStart) : current.rangeStart;
    const end = body.rangeEnd !== undefined ? Number(body.rangeEnd) : current.rangeEnd;
    const valid = (n) => Number.isInteger(n) && n >= 100000 && n <= 999999;

    if (body.rangeStart !== undefined || body.rangeEnd !== undefined) {
      if (!valid(start) || !valid(end)) {
        return NextResponse.json({ error: 'PIN codes must be 6 digits' }, { status: 400 });
      }
      if (end < start) {
        return NextResponse.json(
          { error: 'End PIN must be greater than or equal to start PIN' },
          { status: 400 }
        );
      }
      update.rangeStart = start;
      update.rangeEnd = end;
    }

    if (body.zone !== undefined) {
      if (!ZONES.includes(body.zone)) {
        return NextResponse.json({ error: 'Unknown delivery tier' }, { status: 400 });
      }
      update.zone = body.zone;
    }

    for (const k of ['deliveryDaysMin', 'deliveryDaysMax']) {
      if (body[k] !== undefined) {
        const n = orNull(body[k]);
        if (n !== null && (!Number.isInteger(n) || n < 0 || n > 60)) {
          return NextResponse.json({ error: 'Delivery days must be between 0 and 60' }, { status: 400 });
        }
        update[k] = n;
      }
    }

    if (body.codAvailable !== undefined) update.codAvailable = Boolean(body.codAvailable);
    if (body.active !== undefined) update.active = Boolean(body.active);
    if (body.notes !== undefined) update.notes = String(body.notes).slice(0, 200);

    const zone = await DeliveryZone.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ zone });
  } catch (error) {
    console.error('[delivery] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update delivery area' }, { status: 500 });
  }
}

// DELETE /api/delivery/[id]
//
// Deactivating is usually the better move — it keeps the range and its
// timings for when the area reopens — but a row added by mistake should
// be removable outright.
export async function DELETE(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();

    const deleted = await DeliveryZone.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Delivery area not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[delivery] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete delivery area' }, { status: 500 });
  }
}
