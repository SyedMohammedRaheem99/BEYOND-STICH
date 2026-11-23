import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomeSection from '@/lib/models/HomeSection';
import { getAdminFromRequest } from '@/lib/auth';

const SOURCES = ['manual', 'tag', 'segment', 'newest'];
const LAYOUTS = ['grid', 'carousel'];

/** Blank means "no bound", which the storefront reads as unscheduled. */
const orNull = (v) => (v === '' || v === undefined || v === null ? null : new Date(v));

/**
 * Shared shape for POST and PUT. Only the selector the chosen source
 * actually uses is kept — storing a leftover tag on a segment-sourced
 * section would be invisible until someone switched the source back and
 * got products they never chose.
 */
export function buildPayload(body) {
  const source = SOURCES.includes(body.source) ? body.source : 'tag';

  return {
    title: String(body.title || '').trim().slice(0, 80),
    subtitle: String(body.subtitle || '').trim().slice(0, 200),
    eyebrow: String(body.eyebrow || '').trim().slice(0, 40),

    source,
    tag: source === 'tag' ? String(body.tag || '').trim().toLowerCase().slice(0, 40) : '',
    segment: source === 'segment' ? String(body.segment || '').trim().toUpperCase().slice(0, 40) : '',
    productSlugs:
      source === 'manual'
        ? (Array.isArray(body.productSlugs) ? body.productSlugs : [])
            .map((s) => String(s).trim())
            .filter(Boolean)
            .slice(0, 24)
        : [],

    limit: Math.min(Math.max(parseInt(body.limit, 10) || 8, 1), 24),
    layout: LAYOUTS.includes(body.layout) ? body.layout : 'grid',

    linkLabel: String(body.linkLabel || '').trim().slice(0, 40),
    linkHref: String(body.linkHref || '').trim().slice(0, 200),

    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    active: body.active !== false,
    startsAt: orNull(body.startsAt),
    endsAt: orNull(body.endsAt),
  };
}

/** Returns an error string, or null. */
export function validate(payload) {
  if (!payload.title) return 'Section title is required';
  if (payload.source === 'tag' && !payload.tag) return 'Choose a tag';
  if (payload.source === 'segment' && !payload.segment) return 'Choose a segment';
  if (payload.source === 'manual' && payload.productSlugs.length === 0) {
    return 'Pick at least one product';
  }
  if (payload.linkHref && !payload.linkLabel) return 'Add a label for the link';
  if (payload.startsAt && payload.endsAt && payload.endsAt < payload.startsAt) {
    return 'End date must be after the start date';
  }
  return null;
}

// GET /api/home-sections
export async function GET(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const sections = await HomeSection.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean();
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('[home-sections] GET error:', error);
    return NextResponse.json({ error: 'Failed to load sections' }, { status: 500 });
  }
}

// POST /api/home-sections
export async function POST(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = buildPayload(await request.json());
    const error = validate(payload);
    if (error) return NextResponse.json({ error }, { status: 400 });

    await connectDB();
    const section = await HomeSection.create(payload);
    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('[home-sections] POST error:', error);
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
  }
}
