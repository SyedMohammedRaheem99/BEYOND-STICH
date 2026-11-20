import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { checkPincode } from '@/lib/serviceability';
import { rateLimit, clientKey, tooManyRequests } from '@/lib/rateLimit';

/**
 * GET /api/delivery/check?pincode=560001
 *
 * Serviceability and delivery estimate for one PIN code.
 *
 * The PDP used to answer this in the browser from
 * `/^[14578]/.test(pincode) ? 3 : 6` — so any six digits produced a
 * confident delivery date, including for places we do not ship to. The
 * answer has to come from the server because the same rules decide whether
 * checkout may proceed.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = (searchParams.get('pincode') || '').trim();

    if (!pincode) {
      return NextResponse.json({ error: 'PIN code is required' }, { status: 400 });
    }

    // Public and unauthenticated, and each call is a database lookup.
    // Generous enough that a customer trying a few addresses never notices.
    const wait = rateLimit('delivery-check', clientKey(request), 60, 10 * 60 * 1000);
    if (wait) return tooManyRequests(wait, 'Too many checks. Please try again shortly.');

    await connectDB();

    return NextResponse.json(await checkPincode(pincode));
  } catch (error) {
    console.error('[delivery/check] error:', error);
    // Don't claim serviceability we couldn't verify — but don't show a
    // scary failure on a product page either.
    return NextResponse.json(
      { serviceable: false, reason: "Couldn't check delivery right now. Please try again." },
      { status: 500 }
    );
  }
}
