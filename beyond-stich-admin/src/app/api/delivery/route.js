import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DeliveryZone from '@/lib/models/DeliveryZone';
import { getAdminFromRequest } from '@/lib/auth';

const ZONES = ['local', 'nearby', 'rest'];

/** Shared validation. Returns an error string, or null. */
function validate(body, { partial = false } = {}) {
  const need = (k) => !partial || body[k] !== undefined;

  if (need('name') && !String(body.name || '').trim()) return 'Area name is required';

  if (need('rangeStart') || need('rangeEnd')) {
    const start = Number(body.rangeStart);
    const end = Number(body.rangeEnd);
    const valid = (n) => Number.isInteger(n) && n >= 100000 && n <= 999999;

    if (body.rangeStart !== undefined && !valid(start)) return 'Start PIN must be a 6-digit code';
    if (body.rangeEnd !== undefined && !valid(end)) return 'End PIN must be a 6-digit code';
    if (
      body.rangeStart !== undefined &&
      body.rangeEnd !== undefined &&
      end < start
    ) {
      return 'End PIN must be greater than or equal to start PIN';
    }
  }

  if (body.zone !== undefined && !ZONES.includes(body.zone)) return 'Unknown delivery tier';

  for (const k of ['deliveryDaysMin', 'deliveryDaysMax']) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') {
      const n = Number(body[k]);
      if (!Number.isInteger(n) || n < 0 || n > 60) return 'Delivery days must be between 0 and 60';
    }
  }

  return null;
}

// Blank strings from the form mean "use the tier default", which the
// lookup expresses as null.
const orNull = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

// GET /api/delivery — list every area, widest first
export async function GET(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const zones = await DeliveryZone.find({}).sort({ rangeStart: 1 }).lean();
    return NextResponse.json({ zones });
  } catch (error) {
    console.error('[delivery] GET error:', error);
    return NextResponse.json({ error: 'Failed to load delivery areas' }, { status: 500 });
  }
}

// POST /api/delivery — add an area
export async function POST(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const error = validate(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    await connectDB();

    const zone = await DeliveryZone.create({
      name: String(body.name).trim(),
      rangeStart: Number(body.rangeStart),
      rangeEnd: Number(body.rangeEnd),
      zone: body.zone || 'rest',
      deliveryDaysMin: orNull(body.deliveryDaysMin),
      deliveryDaysMax: orNull(body.deliveryDaysMax),
      codAvailable: body.codAvailable !== false,
      active: body.active !== false,
      notes: String(body.notes || '').slice(0, 200),
    });

    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    console.error('[delivery] POST error:', error);
    return NextResponse.json({ error: 'Failed to add delivery area' }, { status: 500 });
  }
}
