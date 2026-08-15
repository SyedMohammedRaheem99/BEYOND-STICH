import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name || !email || !password
    ) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    const wait = rateLimit('register', clientKey(request), 5, 60 * 60 * 1000);
    if (wait) return tooManyRequests(wait);

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const normalisedEmail = email.toLowerCase().trim();

    const newUser = await User.create({
      name: name.trim(),
      email: normalisedEmail,
      passwordHash,
      provider: 'credentials',
      role: 'customer',
    });

    // Claim any orders this person placed as a guest with the same email.
    // Without this, someone who checks out and then creates an account sees
    // "no orders yet" for an order they just placed — the most common
    // support ticket in D2C.
    try {
      await Order.updateMany(
        { email: normalisedEmail, user: null },
        { $set: { user: newUser._id } }
      );
    } catch (err) {
      // Never fail signup over this — /api/orders also matches on email.
      console.error('[register] guest order backfill failed', err);
    }

    return NextResponse.json({ message: 'Account created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
