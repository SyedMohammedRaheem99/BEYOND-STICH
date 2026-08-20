import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { resolveCoupon } from '@/lib/coupon';

// POST /api/coupon/validate  { code, subtotal }
// Advisory endpoint for the checkout UI. The authoritative check runs again in
// /api/orders — see src/lib/coupon.js.
export async function POST(request) {
  try {
    const { code, subtotal = 0, email = '' } = await request.json();

    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ valid: false, message: 'Enter a coupon code' }, { status: 400 });
    }

    await connectDB();

    // email lets first-order-only offers be checked here rather than failing
    // at order time, after the customer thinks the discount applied.
    const result = await resolveCoupon(
      code,
      Number(subtotal) || 0,
      typeof email === 'string' ? email : ''
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Coupon validate error:', error);
    return NextResponse.json({ valid: false, message: 'Could not validate coupon' }, { status: 500 });
  }
}
