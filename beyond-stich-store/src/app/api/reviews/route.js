import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/lib/models/Review';

// GET /api/reviews?slug=mind-over-matter
// Returns approved reviews + summary (average, count, 5→1 distribution).
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get('slug') || '').toLowerCase().trim();
    if (!slug) {
      return NextResponse.json({ error: 'Missing product slug' }, { status: 400 });
    }

    await connectDB();

    const reviews = await Review.find({ productSlug: slug, approved: true })
      .sort({ createdAt: -1 })
      .lean();

    const count = reviews.length;
    const average = count
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) distribution[r.rating] = (distribution[r.rating] || 0) + 1;

    return NextResponse.json({ reviews, average, count, distribution });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

// POST /api/reviews  { slug, authorName, authorEmail?, rating, title, body }
export async function POST(request) {
  try {
    const data = await request.json();
    const slug = (data.slug || '').toLowerCase().trim();
    const rating = Number(data.rating);

    if (!slug) return NextResponse.json({ error: 'Missing product' }, { status: 400 });
    if (!(rating >= 1 && rating <= 5)) {
      return NextResponse.json({ error: 'Please select a rating (1–5 stars)' }, { status: 400 });
    }
    if (!data.authorName?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!data.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!data.body?.trim()) return NextResponse.json({ error: 'Review text is required' }, { status: 400 });

    await connectDB();

    const review = await Review.create({
      productSlug: slug,
      authorName: data.authorName.trim().slice(0, 60),
      authorEmail: (data.authorEmail || '').trim().toLowerCase(),
      rating,
      title: data.title.trim().slice(0, 100),
      body: data.body.trim().slice(0, 1000),
      // verified is set by the admin (or, later, automatically from a matching
      // delivered order). Never self-claimed by the submitter.
      verified: false,
      approved: true,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Review CREATE error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
