import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import { getAdminFromRequest } from '@/lib/auth';

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

    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Review DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
