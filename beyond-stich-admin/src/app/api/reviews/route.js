import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product';
import { getAdminFromRequest } from '@/lib/auth';
import { recalcProductRating } from '@/lib/reviewStats';

// GET /api/reviews — Fetch all reviews with filters
export async function GET(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;

    let query = {};

    if (status === 'pending') {
      query.approved = true;
      query.verified = false;
    } else if (status === 'approved') {
      query.approved = true;
      query.verified = true;
    } else if (status === 'rejected') {
      query.approved = false;
    }

    if (search) {
      query.$or = [
        { productSlug: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}


const MAX_IMAGES = 5;

/** Shared shape for POST and PUT. */
export function buildPayload(body) {
  return {
    productSlug: String(body.productSlug || '').trim().toLowerCase(),
    authorName: String(body.authorName || '').trim().slice(0, 60),
    authorEmail: String(body.authorEmail || '').trim().toLowerCase(),
    rating: Math.min(Math.max(parseInt(body.rating, 10) || 0, 1), 5),
    title: String(body.title || '').trim().slice(0, 100),
    body: String(body.body || '').trim().slice(0, 1000),
    images: (Array.isArray(body.images) ? body.images : [])
      .map((u) => String(u).trim())
      .filter(Boolean)
      .slice(0, MAX_IMAGES),
    verified: body.verified === true,
    approved: body.approved !== false,
  };
}

/**
 * Returns an error string, or null.
 *
 * Async because the product has to exist: a review on a slug that matches
 * nothing is invisible on the site but still counted in the admin, which is
 * the kind of mismatch nobody notices until the numbers are questioned.
 */
export async function validate(payload) {
  if (!payload.productSlug) return 'Choose a product';
  if (!payload.authorName) return 'Reviewer name is required';
  if (!payload.rating) return 'Pick a rating from 1 to 5';
  if (!payload.title) return 'A title is required';
  if (!payload.body) return 'Review text is required';
  if (payload.authorEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.authorEmail)) {
    return 'Enter a valid email address, or leave it blank';
  }

  const product = await Product.findOne({ slug: payload.productSlug }).select('_id').lean();
  if (!product) return `No product with the slug ${payload.productSlug}`;

  return null;
}

// POST /api/reviews — create a review from the admin.
export async function POST(request) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = buildPayload(await request.json());

    await connectDB();
    const error = await validate(payload);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const review = await Review.create(payload);
    await recalcProductRating(payload.productSlug);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
