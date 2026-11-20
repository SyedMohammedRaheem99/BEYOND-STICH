import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';
import { issueOtp, resendCooldownRemaining } from '@/lib/otp';
import { sendVerificationOtp } from '@/lib/email';

/**
 * POST /api/auth/resend-otp  { email }
 *
 * Issues a fresh verification code. Needed whenever the first one expired,
 * was never delivered, or had its guess budget used up.
 *
 * Replies identically whether or not the account exists, so this can't be
 * used to discover who has registered.
 */
const GENERIC = 'If that account needs verification, a new code has been sent.';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Two ceilings: per-caller and per-target. The second is what stops one
    // address being mail-bombed from many IPs, which would burn the sending
    // domain's reputation and take order confirmations down with it.
    const wait =
      rateLimit('resend-otp-ip', clientKey(request), 10, 60 * 60 * 1000) ||
      rateLimit('resend-otp-email', email, 5, 60 * 60 * 1000);
    if (wait) return tooManyRequests(wait);

    await connectDB();

    const user = await User.findOne({ email }).select('+otpLastSentAt');

    // Nothing to do — but say the same thing as the success case.
    if (!user || user.emailVerified) {
      return NextResponse.json({ message: GENERIC });
    }

    // Durable per-account cooldown. The in-memory limiter above can't be
    // relied on alone: serverless instances don't share memory, so a caller
    // hitting different instances would slip past it.
    const cooldown = resendCooldownRemaining(user.otpLastSentAt);
    if (cooldown > 0) {
      return NextResponse.json(
        {
          error: `Please wait ${cooldown}s before requesting another code.`,
          retryAfter: cooldown,
        },
        { status: 429, headers: { 'Retry-After': String(cooldown) } }
      );
    }

    // A new code also resets the attempt counter — otherwise a customer who
    // mistyped five times could never recover.
    const { code, ...otpFields } = issueOtp();
    Object.assign(user, otpFields);
    await user.save();

    const mail = await sendVerificationOtp(email, code, user.name);
    if (!mail?.ok) {
      // The generic message would leave them waiting for mail that isn't
      // coming. This path reveals nothing — they already know the address.
      console.error('[resend-otp] delivery failed for', email, mail?.error);
      return NextResponse.json(
        { error: "We couldn't send the email just now. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: GENERIC });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
