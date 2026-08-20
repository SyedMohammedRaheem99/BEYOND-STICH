import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import StockNotification from '@/lib/models/StockNotification';
import { isValidEmail } from '@/lib/orderIntegrity';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

// POST /api/notify-stock  { slug, size, email }
// Registers interest in a sold-out size. Previously an out-of-stock size was
// a dead end — a disabled button with no way for the customer to signal
// demand, so both the sale and the restock data were lost.
export async function POST(request) {
  try {
    const { slug, size, email } = await request.json();

    if (typeof slug !== 'string' || typeof size !== 'string' || typeof email !== 'string') {
      return NextResponse.json({ error: 'Missing details' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    const wait = rateLimit('notify-stock', clientKey(request), 20, 60 * 60 * 1000);
    if (wait) return tooManyRequests(wait);

    await connectDB();

    // Only accept requests for products that actually exist.
    const product = await Product.findOne({ slug: slug.toLowerCase().trim(), isActive: true })
      .select('_id')
      .lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    try {
      await StockNotification.create({
        productSlug: slug.toLowerCase().trim(),
        size: size.trim().slice(0, 20),
        email: email.trim().toLowerCase().slice(0, 254),
      });
    } catch (err) {
      // Duplicate: they're already on the list, which is a success from the
      // customer's point of view.
      if (err.code !== 11000) throw err;
    }

    return NextResponse.json({
      message: "You're on the list. We'll email you the moment it's back.",
    });
  } catch (error) {
    console.error('Notify stock error:', error);
    return NextResponse.json({ error: 'Could not add you to the list' }, { status: 500 });
  }
}
