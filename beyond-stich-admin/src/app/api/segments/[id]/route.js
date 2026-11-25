import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Segment from '@/lib/models/Segment';
import Product from '@/lib/models/Product';
import { getAdminFromRequest } from '@/lib/auth';
import { buildPayload, validate } from '../route';

// PUT /api/segments/[id]
export async function PUT(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const current = await Segment.findById(id);
    if (!current) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // A toggle from the list sends only { active } or { showInGrid }; the
    // full payload builder would blank every other field.
    const keys = Object.keys(body);
    if (keys.length === 1 && (typeof body.active === 'boolean' || typeof body.showInGrid === 'boolean')) {
      // Switching off a world hides its page and removes it from every menu.
      // Doing that while products still live there makes them unreachable
      // except by direct link, so it has to be a deliberate choice.
      if (body.active === false) {
        const count = await Product.countDocuments({ segment: current.name, isActive: true });
        if (count > 0) {
          return NextResponse.json(
            {
              error: `${current.name} still holds ${count} active product${count === 1 ? '' : 's'}. Move them to another world first, or they will be unreachable.`,
            },
            { status: 409 }
          );
        }
      }

      const updated = await Segment.findByIdAndUpdate(id, { $set: body }, { new: true });
      return NextResponse.json({ segment: updated });
    }

    const payload = buildPayload(body);
    const error = await validate(payload, id);
    if (error) return NextResponse.json({ error }, { status: 400 });

    /**
     * Products store the segment NAME, not an ObjectId. Renaming a segment
     * without moving its products would leave every one of them pointing at
     * a world that no longer exists — they would vanish from their own
     * page, from /shop filters and from the grid, while still looking fine
     * in the product list.
     *
     * So the rename and the move are one operation. Mongoose has no
     * multi-document transaction here without a replica-set session, so the
     * products are updated FIRST: if that fails, the segment keeps its old
     * name and nothing is orphaned. The reverse order could orphan them.
     */
    const renamed = payload.name !== current.name;
    let movedCount = 0;

    if (renamed) {
      const result = await Product.updateMany(
        { segment: current.name },
        { $set: { segment: payload.name } }
      );
      movedCount = result.modifiedCount || 0;
    }

    const segment = await Segment.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ segment, movedCount, renamed });
  } catch (error) {
    console.error('[segments] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update segment' }, { status: 500 });
  }
}

// DELETE /api/segments/[id]
export async function DELETE(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();

    const segment = await Segment.findById(id);
    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Refuse while anything still lives there. A deleted world leaves its
    // products with a segment value nothing resolves — invisible on the
    // site but still in the database, which is the hardest kind of bug to
    // notice. Switching it off instead is offered in the message.
    const count = await Product.countDocuments({ segment: segment.name });
    if (count > 0) {
      return NextResponse.json(
        {
          error: `${segment.name} still holds ${count} product${count === 1 ? '' : 's'}. Move them to another world first, or switch this one off instead of deleting it.`,
        },
        { status: 409 }
      );
    }

    await Segment.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[segments] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete segment' }, { status: 500 });
  }
}
