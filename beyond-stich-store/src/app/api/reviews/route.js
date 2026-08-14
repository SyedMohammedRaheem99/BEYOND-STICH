import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import Order from '@/lib/models/Order';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

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

    // Never project authorEmail — this endpoint is public, and returning whole
    // documents previously disclosed every reviewer's email address.
    const reviews = await Review.find({ productSlug: slug, approved: true })
      .select('productSlug authorName rating title body verified createdAt')
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
    const slug = (typeof data.slug === 'string' ? data.slug : '').toLowerCase().trim();
    const rating = Number(data.rating);

    // Review text feeds the AggregateRating schema Google reads, so unlimited
    // anonymous submissions would let anyone manufacture star ratings.
    const wait = rateLimit('review-submit', clientKey(request), 5, 60 * 60 * 1000);
    if (wait) {
      return tooManyRequests(wait, 'You have submitted several reviews already. Please try again later.');
    }

    if (!slug) return NextResponse.json({ error: 'Missing product' }, { status: 400 });
    if (!(rating >= 1 && rating <= 5)) {
      return NextResponse.json({ error: 'Please select a rating (1–5 stars)' }, { status: 400 });
    }
    if (!data.authorName?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!data.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!data.body?.trim()) return NextResponse.json({ error: 'Review text is required' }, { status: 400 });

    await connectDB();

    const authorEmail = (typeof data.authorEmail === 'string' ? data.authorEmail : '')
      .trim()
      .toLowerCase();

    // A review is auto-published only when we can match it to a real order for
    // this product from the same email. Everything else waits for admin
    // approval, so anonymous submissions can't manufacture star ratings.
    let verified = false;
    if (authorEmail) {
      try {
        const matchingOrder = await Order.findOne({
          email: authorEmail,
          'items.productSlug': slug,
        })
          .select('_id')
          .lean();
        verified = Boolean(matchingOrder);
      } catch (err) {
        console.error('[reviews] purchase verification failed', err);
      }
    }

    const review = await Review.create({
      productSlug: slug,
      authorName: data.authorName.trim().slice(0, 60),
      authorEmail,
      rating,
      title: data.title.trim().slice(0, 100),
      body: data.body.trim().slice(0, 1000),
      verified,
      approved: verified,
    });

    return NextResponse.json(
      {
        review: {
          productSlug: review.productSlug,
          authorName: review.authorName,
          rating: review.rating,
          title: review.title,
          body: review.body,
          verified: review.verified,
          createdAt: review.createdAt,
        },
        pending: !review.approved,
        message: review.approved
          ? 'Thanks for your review!'
          : 'Thanks! Your review will appear once our team approves it.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Review CREATE error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
