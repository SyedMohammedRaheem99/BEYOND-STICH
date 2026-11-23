import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomeSection from '@/lib/models/HomeSection';
import { getAdminFromRequest } from '@/lib/auth';
import { buildPayload, validate } from '../route';

// PUT /api/home-sections/[id]
export async function PUT(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    await connectDB();

    // A bare toggle from the list view sends only { active }, and running
    // the full payload builder over that would blank every other field.
    if (Object.keys(body).length === 1 && typeof body.active === 'boolean') {
      const section = await HomeSection.findByIdAndUpdate(
        id,
        { $set: { active: body.active } },
        { new: true }
      );
      if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      return NextResponse.json({ section });
    }

    const payload = buildPayload(body);
    const error = validate(payload);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const section = await HomeSection.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

    return NextResponse.json({ section });
  } catch (error) {
    console.error('[home-sections] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}

// DELETE /api/home-sections/[id]
export async function DELETE(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();

    const deleted = await HomeSection.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[home-sections] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
  }
}
