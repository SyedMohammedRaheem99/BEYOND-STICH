import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';

export const revalidate = 300;

// GET /api/coupons
// Publicly listable offers for the checkout page.
//
// An empty "enter coupon code" box is a conversion leak: shoppers leave to
// search for codes elsewhere and often don't come back, while the store's own
// active coupons go unused. Only fields needed to display an offer are
// returned — never usage counts or internal limits.
export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const coupons = await Coupon.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select('code type value minOrder maxDiscount expiresAt usageLimit usedCount')
      .sort({ minOrder: 1 })
      .limit(6)
      .lean();

    const available = coupons
      // Drop any that have already hit their cap.
      .filter((c) => !(c.usageLimit > 0 && c.usedCount >= c.usageLimit))
      .map((c) => ({
        code: c.code,
        minOrder: c.minOrder || 0,
        label:
          c.type === 'percent'
            ? `${c.value}% off${c.maxDiscount > 0 ? ` up to ₹${c.maxDiscount}` : ''}`
            : c.type === 'flat'
              ? `₹${c.value} off`
              : 'Free shipping',
      }));

    return NextResponse.json({ coupons: available });
  } catch (error) {
    console.error('Coupons list error:', error);
    // Never break checkout over this — just show no offers.
    return NextResponse.json({ coupons: [] });
  }
}
