import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';

// POST /api/coupon/validate  { code, subtotal }
// Validates a coupon against the database and returns the computed discount.
export async function POST(request) {
  try {
    const { code, subtotal = 0 } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, message: 'Enter a coupon code' }, { status: 400 });
    }

    await connectDB();

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();

    if (!coupon || !coupon.active) {
      return NextResponse.json({ valid: false, message: 'Invalid coupon code' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, message: 'This coupon has expired' });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: 'This coupon is no longer available' });
    }

    if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
      return NextResponse.json({
        valid: false,
        message: `Add ₹${coupon.minOrder - subtotal} more to use this coupon`,
      });
    }

    // Compute the discount
    let discount = 0;
    let freeShipping = false;

    if (coupon.type === 'percent') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'flat') {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'shipping') {
      freeShipping = true;
    }

    const label =
      coupon.type === 'percent' ? `${coupon.value}% off`
      : coupon.type === 'flat' ? `₹${coupon.value} off`
      : 'Free shipping';

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount,
      freeShipping,
      label,
      message: `${coupon.code} applied — ${label}`,
    });
  } catch (error) {
    console.error('Coupon validate error:', error);
    return NextResponse.json({ valid: false, message: 'Could not validate coupon' }, { status: 500 });
  }
}
