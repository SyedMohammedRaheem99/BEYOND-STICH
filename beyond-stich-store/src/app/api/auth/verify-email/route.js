import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';
import { verifyOtpHash, normaliseOtpInput, OTP_MAX_ATTEMPTS, OTP_LENGTH } from '@/lib/otp';

/**
 * POST /api/auth/verify-email  { email, code }
 *
 * Confirms the person signing up can read mail at the address they gave,
 * then — and only then — attaches any guest orders placed with it.
 *
 * That ordering is the whole point. Guest checkout stores orders keyed by
 * email alone, so claiming them at registration time would let anyone who
 * typed a stranger's address inherit that person's order history, including
 * their name, phone number and full shipping address.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Reject non-strings outright: an object like {$ne: null} reaching a
    // query would otherwise match documents it shouldn't.
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = normaliseOtpInput(body.code);

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }
    if (code.length !== OTP_LENGTH) {
      return NextResponse.json({ error: `Enter the ${OTP_LENGTH}-digit code` }, { status: 400 });
    }

    // Network-level ceiling, on top of the per-account attempt counter below.
    // Stops one caller working through many accounts from a single IP.
    const wait = rateLimit('verify-email', clientKey(request), 20, 60 * 60 * 1000);
    if (wait) return tooManyRequests(wait);

    await connectDB();

    const user = await User.findOne({ email }).select(
      '+otpHash +otpExpiry +otpAttempts +otpLastSentAt'
    );

    // Deliberately the same response as a wrong code: distinguishing them
    // would turn this endpoint into an account-existence oracle.
    if (!user) {
      return NextResponse.json(
        { error: 'That code is not valid. Request a new one.' },
        { status: 400 }
      );
    }

    // Idempotent: a double-submit, or a customer returning to a stale tab,
    // should land on success rather than a confusing error.
    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email already verified', verified: true });
    }

    if (!user.otpHash || !user.otpExpiry) {
      return NextResponse.json(
        { error: 'No active code. Request a new one.', needsResend: true },
        { status: 400 }
      );
    }

    if (new Date(user.otpExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'That code has expired. Request a new one.', needsResend: true },
        { status: 400 }
      );
    }

    // Burn the code once the guess budget is gone, so an attacker can't keep
    // working the same code by waiting out the IP limiter.
    if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      user.otpHash = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Request a new code.', needsResend: true },
        { status: 429 }
      );
    }

    if (!verifyOtpHash(code, user.otpHash)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      const left = Math.max(0, OTP_MAX_ATTEMPTS - user.otpAttempts);
      return NextResponse.json(
        {
          error: left > 0
            ? `Incorrect code. ${left} ${left === 1 ? 'try' : 'tries'} left.`
            : 'Too many incorrect attempts. Request a new code.',
          attemptsLeft: left,
          needsResend: left === 0,
        },
        { status: 400 }
      );
    }

    // --- Verified ---
    user.emailVerified = true;
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    // Now it is safe to attach guest orders: ownership of the address has
    // been demonstrated.
    let claimedOrders = 0;
    try {
      const res = await Order.updateMany(
        { email, user: null },
        { $set: { user: user._id } }
      );
      claimedOrders = res.modifiedCount || 0;
    } catch (err) {
      // Verification itself succeeded — don't fail the request over this.
      // /api/orders also matches on the signed-in user's email, so the
      // orders remain visible regardless.
      console.error('[verify-email] guest order claim failed', err);
    }

    return NextResponse.json({
      message: 'Email verified. You can now sign in.',
      verified: true,
      claimedOrders,
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
