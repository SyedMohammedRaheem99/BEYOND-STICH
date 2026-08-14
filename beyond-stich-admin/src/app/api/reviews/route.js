import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import { getAdminFromRequest } from '@/lib/auth';

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
