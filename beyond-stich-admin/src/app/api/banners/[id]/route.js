import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';
import { getAdminFromRequest } from '@/lib/auth';
import { buildPayload, validate } from '../route';

// PUT /api/banners/[id]
export async function PUT(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    await connectDB();

    // A toggle from the list sends only { active }; the full payload
    // builder would blank every other field.
    if (Object.keys(body).length === 1 && typeof body.active === 'boolean') {
      const banner = await Banner.findByIdAndUpdate(
        id,
        { $set: { active: body.active } },
        { new: true }
      );
      if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
      return NextResponse.json({ banner });
    }

    const payload = buildPayload(body);
    const error = await validate(payload);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const banner = await Banner.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('[banners] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE /api/banners/[id]
export async function DELETE(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();

    const deleted = await Banner.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[banners] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
