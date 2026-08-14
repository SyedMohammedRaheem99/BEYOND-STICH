import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { resolveCoupon } from '@/lib/coupon';

// POST /api/coupon/validate  { code, subtotal }
// Advisory endpoint for the checkout UI. The authoritative check runs again in
// /api/orders — see src/lib/coupon.js.
export async function POST(request) {
  try {
    const { code, subtotal = 0 } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, message: 'Enter a coupon code' }, { status: 400 });
    }

    await connectDB();

    const result = await resolveCoupon(code, Number(subtotal) || 0);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Coupon validate error:', error);
    return NextResponse.json({ valid: false, message: 'Could not validate coupon' }, { status: 500 });
  }
}
