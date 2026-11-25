import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Segment from '@/lib/models/Segment';
import Product from '@/lib/models/Product';
import { getAdminFromRequest } from '@/lib/auth';

const slugify = (v) =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

export function buildPayload(body) {
  const name = String(body.name || '').trim().toUpperCase().slice(0, 40);
  return {
    name,
    // Falls back to the name so the owner never has to think about URLs.
    slug: slugify(body.slug || name),
    tagline: String(body.tagline || '').trim().slice(0, 80),
    description: String(body.description || '').trim().slice(0, 300),
    longDescription: String(body.longDescription || '').trim().slice(0, 4000),
    accent: String(body.accent || '').trim(),
    icon: String(body.icon || '').trim().slice(0, 40),
    image: String(body.image || '').trim(),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    active: body.active !== false,
    showInGrid: body.showInGrid !== false,
  };
}

/**
 * Returns an error string, or null.
 *
 * Async because uniqueness is a database question. `excludeId` lets an edit
 * keep its own slug and name without colliding with itself.
 */
export async function validate(payload, excludeId = null) {
  if (!payload.name) return 'Name is required';
  if (!payload.slug) return 'Slug is required';
  if (!/^[a-z0-9-]+$/.test(payload.slug)) {
    return 'Slug can only contain lower-case letters, numbers and hyphens';
  }
  if (payload.accent && !/^#[0-9a-fA-F]{6}$/.test(payload.accent)) {
    return 'Accent must be a 6-digit hex colour like #F5C518';
  }

  const clash = { $or: [{ slug: payload.slug }, { name: payload.name }] };
  if (excludeId) clash._id = { $ne: excludeId };

  const existing = await Segment.findOne(clash).lean();
  if (existing) {
    return existing.slug === payload.slug
      ? `The URL /segment/${payload.slug} is already used by ${existing.name}.`
      : `A segment called ${payload.name} already exists.`;
  }

  return null;
}

// GET /api/segments — every segment, including inactive ones.
export async function GET(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const segments = await Segment.find({}).sort({ sortOrder: 1, name: 1 }).lean();

    // Product counts come from the products themselves, so the admin can
    // see what a segment actually holds before switching it off or
    // deleting it.
    const counts = await Product.aggregate([
      { $group: { _id: '$segment', count: { $sum: 1 } } },
    ]);
    const byName = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    return NextResponse.json({
      segments: segments.map((s) => ({ ...s, productCount: byName[s.name] || 0 })),
    });
  } catch (error) {
    console.error('[segments] GET error:', error);
    return NextResponse.json({ error: 'Failed to load segments' }, { status: 500 });
  }
}

// POST /api/segments
export async function POST(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = buildPayload(await request.json());

    await connectDB();
    const error = await validate(payload);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const segment = await Segment.create(payload);
    return NextResponse.json({ segment }, { status: 201 });
  } catch (error) {
    console.error('[segments] POST error:', error);
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
  }
}
