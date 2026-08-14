import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { sendPasswordReset } from '@/lib/email';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (typeof email !== 'string' || !email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Without this, anyone can mail-bomb an address and burn our sending
    // domain's reputation. Limit per caller and per targeted address.
    const wait =
      rateLimit('forgot-password-ip', clientKey(request), 5, 60 * 60 * 1000) ||
      rateLimit('forgot-password-email', email.trim().toLowerCase(), 3, 60 * 60 * 1000);
    if (wait) return tooManyRequests(wait);

    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user || user.provider === 'google') {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate secure token. Only its SHA-256 hash is stored, so a leaked DB
    // dump can't be used to reset accounts — the raw token exists only in the
    // email we send.
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    // Send email (fire-and-forget)
    sendPasswordReset(email, resetUrl).catch(() => {});

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
