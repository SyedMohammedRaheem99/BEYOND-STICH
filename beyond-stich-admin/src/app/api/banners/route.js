import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';
import Coupon from '@/lib/models/Coupon';
import { getAdminFromRequest } from '@/lib/auth';

const PLACEMENTS = ['home-hero', 'shop-hero'];

const orNull = (v) => (v === '' || v === undefined || v === null ? null : new Date(v));

export function buildPayload(body) {
  return {
    placement: PLACEMENTS.includes(body.placement) ? body.placement : 'home-hero',
    name: String(body.name || '').trim().slice(0, 80),
    desktopImage: String(body.desktopImage || '').trim(),
    mobileImage: String(body.mobileImage || '').trim(),
    badge: String(body.badge || '').trim().slice(0, 40),
    headline: String(body.headline || '').trim().slice(0, 200),
    subheadline: String(body.subheadline || '').trim().slice(0, 300),
    ctaLabel: String(body.ctaLabel || '').trim().slice(0, 40),
    ctaHref: String(body.ctaHref || '/shop').trim().slice(0, 200),
    code: String(body.code || '').trim().toUpperCase().slice(0, 40),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    active: body.active !== false,
    startsAt: orNull(body.startsAt),
    endsAt: orNull(body.endsAt),
  };
}

/**
 * Returns an error string, or null.
 *
 * Async because the coupon check is a database lookup: a banner promising
 * a code that does not exist sends customers to "Invalid coupon code" at
 * checkout, which costs more than running no offer at all. This has
 * happened before — the announcement bar advertised WELCOME20, which was
 * never in the database.
 */
export async function validate(payload) {
  if (!payload.desktopImage) return 'A desktop image is required';
  if (!payload.headline) return 'A headline is required';
  if (payload.ctaLabel && !payload.ctaHref) return 'Add a destination for the button';
  if (payload.startsAt && payload.endsAt && payload.endsAt < payload.startsAt) {
    return 'End date must be after the start date';
  }

  if (payload.code) {
    const coupon = await Coupon.findOne({ code: payload.code }).lean();
    if (!coupon) {
      return `No coupon called ${payload.code} exists — customers would hit "Invalid coupon code" at checkout.`;
    }
    if (!coupon.active) {
      return `${payload.code} exists but is switched off.`;
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return `${payload.code} has expired.`;
    }
  }

  return null;
}

// GET /api/banners?placement=home-hero
export async function GET(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');

    const filter = PLACEMENTS.includes(placement) ? { placement } : {};
    const banners = await Banner.find(filter).sort({ placement: 1, sortOrder: 1 }).lean();

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('[banners] GET error:', error);
    return NextResponse.json({ error: 'Failed to load banners' }, { status: 500 });
  }
}

// POST /api/banners
export async function POST(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = buildPayload(await request.json());

    await connectDB();
    const error = await validate(payload);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const banner = await Banner.create(payload);
    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('[banners] POST error:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
