import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';
import { issueOtp } from '@/lib/otp';
import { sendVerificationOtp } from '@/lib/email';

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

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const normalisedEmail = email.toLowerCase().trim();

    // The account starts unverified and carries a one-time code. Until the
    // customer proves they can read mail at this address, the account can't
    // sign in and claims no guest orders (see below).
    const { code, ...otpFields } = issueOtp();

    const newUser = await User.create({
      name: name.trim(),
      email: normalisedEmail,
      passwordHash,
      provider: 'credentials',
      role: 'customer',
      emailVerified: false,
      ...otpFields,
    });

    // Awaited, not fire-and-forget: if the code never left the building the
    // customer is stuck on a verification screen with nothing to type, and
    // telling them so immediately is far better than silence.
    const mail = await sendVerificationOtp(normalisedEmail, code, newUser.name);

    // Guest orders are deliberately NOT claimed here.
    //
    // This route used to run Order.updateMany({ email, user: null }) to
    // attach past guest orders to the new account. Two problems with that:
    //
    //  1. `Order` was never imported, so it threw ReferenceError on every
    //     signup. The catch swallowed it, so the backfill never actually ran.
    //  2. Far worse, had it worked it would have been an account-takeover
    //     path: anyone could register with a stranger's email — nothing
    //     verified ownership — and inherit that person's orders, exposing
    //     their name, phone and full shipping address.
    //
    // The claim now happens in /api/auth/verify-email, once the OTP proves
    // the person controls the address. Until then /api/orders still matches
    // on email for the *signed-in* user's own address, so nothing is lost.
    return NextResponse.json(
      {
        message: 'Account created. Check your email for a verification code.',
        // Drives the redirect to /verify-email.
        requiresVerification: true,
        email: normalisedEmail,
        // The account exists either way — surfacing the delivery failure
        // lets the UI offer "resend" instead of pretending all is well.
        emailSent: mail?.ok !== false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
