import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

// PUT /api/user/password  { currentPassword, newPassword }
// Lets a signed-in customer change their password without the logout →
// forgot-password → email round trip, which was previously the only route
// (and which silently does nothing when email isn't configured).
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Guessing the current password is the attack here, so limit attempts.
    const wait = rateLimit('change-password', clientKey(request), 10, 15 * 60 * 1000);
    if (wait) return tooManyRequests(wait);

    await connectDB();

    const user = await User.findById(session.user.id).select('+passwordHash provider');
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Google accounts have no password to change.
    if (user.provider === 'google' || !user.passwordHash) {
      return NextResponse.json(
        { error: 'This account signs in with Google, so it has no password.' },
        { status: 400 }
      );
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Could not update password' }, { status: 500 });
  }
}
