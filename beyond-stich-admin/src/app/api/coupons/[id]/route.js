import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';
import { getAdminFromRequest } from '@/lib/auth';

// PUT /api/coupons/[id] — update a coupon
export async function PUT(request, { params }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    if (body.code) body.code = body.code.trim().toUpperCase();

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Coupon UPDATE error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE /api/coupons/[id]
export async function DELETE(request, { params }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    console.error('Coupon DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
