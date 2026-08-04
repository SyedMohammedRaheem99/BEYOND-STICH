import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/coupons — list all coupons
export async function GET(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons, count: coupons.length });
  } catch (error) {
    console.error('Coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST /api/coupons — create a coupon
export async function POST(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    if (body.code) body.code = body.code.trim().toUpperCase();

    const coupon = await Coupon.create(body);
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error('Coupon CREATE error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
