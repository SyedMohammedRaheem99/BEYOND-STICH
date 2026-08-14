import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { comparePassword, signToken, TOKEN_NAME } from '@/lib/auth';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Reject non-string input before it reaches Mongo: an object such as
    // {"$ne": null} would otherwise match the first admin account and turn
    // this into an account-enumeration + password-guessing oracle.
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Admin credentials are the highest-value target in the system; without a
    // cap the password can simply be guessed at machine speed.
    const wait = rateLimit('admin-login', clientKey(request), 10, 15 * 60 * 1000);
    if (wait) {
      return tooManyRequests(wait, 'Too many login attempts. Please try again later.');
    }

    await connectDB();

    // Find user with admin role
    const user = await User.findOne({ email: email.trim().toLowerCase(), role: 'admin' })
      .select('+passwordHash');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or not an admin' },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
