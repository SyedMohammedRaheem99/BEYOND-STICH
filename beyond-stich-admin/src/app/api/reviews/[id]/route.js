import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import { getAdminFromRequest } from '@/lib/auth';
import { recalcProductRating } from '@/lib/reviewStats';
import { buildPayload, validate } from '../route';

// PATCH /api/reviews/:id — Approve or reject a review
export async function PATCH(request, { params }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const allowedFields = ['approved', 'verified'];
    const update = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const review = await Review.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    // Approving or rejecting changes which reviews count, so the product's
    // cached rating has to follow or listings disagree with the product page.
    if (update.approved !== undefined) {
      await recalcProductRating(review.productSlug);
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Review PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE /api/reviews/:id — Delete a review
export async function DELETE(request, { params }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const { id } = await params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    // Removing the last review must clear the stars, not leave them behind.
    await recalcProductRating(review.productSlug);

    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Review DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

// PUT /api/reviews/:id — full edit, including the rating and photos.
export async function PUT(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const payload = buildPayload(await request.json());

    await connectDB();

    const existing = await Review.findById(id).select('productSlug').lean();
    if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const error = await validate(payload);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    // Moving a review to a different product changes two ratings, not one.
    await recalcProductRating(payload.productSlug);
    if (existing.productSlug && existing.productSlug !== payload.productSlug) {
      await recalcProductRating(existing.productSlug);
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Review PUT error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
