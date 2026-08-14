import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Newsletter from '@/lib/models/Newsletter';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Unauthenticated write — limit it so the list can't be flooded with junk.
    const wait = rateLimit('newsletter', clientKey(request), 5, 60 * 60 * 1000);
    if (wait) return tooManyRequests(wait);

    await connectDB();

    await Newsletter.create({ email: email.trim().toLowerCase().slice(0, 254) });

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
  } catch (error) {
    // Duplicate email
    if (error.code === 11000) {
      return NextResponse.json({ message: 'You are already subscribed!' }, { status: 200 });
    }
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
