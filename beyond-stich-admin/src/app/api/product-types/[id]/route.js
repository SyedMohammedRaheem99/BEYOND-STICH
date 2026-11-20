import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductType from '@/lib/models/ProductType';
import Product from '@/lib/models/Product';
import { getAdminFromRequest } from '@/lib/auth';
import { buildPayload } from '../route';

// PUT /api/product-types/[id]
export async function PUT(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const payload = buildPayload(await request.json());

    if (!payload.name) {
      return NextResponse.json({ error: 'Type name is required' }, { status: 400 });
    }

    await connectDB();

    const current = await ProductType.findById(id);
    if (!current) {
      return NextResponse.json({ error: 'Product type not found' }, { status: 404 });
    }

    // Products reference their type by name, so a rename has to carry them
    // along or they would all point at a type that no longer exists and
    // lose their size chart.
    const renamed = current.name !== payload.name;
    if (renamed) {
      const clash = await ProductType.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      }).lean();
      if (clash) {
        return NextResponse.json({ error: 'A type with that name already exists' }, { status: 409 });
      }
    }

    const type = await ProductType.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    let productsRenamed = 0;
    if (renamed) {
      const res = await Product.updateMany(
        { productType: current.name },
        { $set: { productType: payload.name } }
      );
      productsRenamed = res.modifiedCount || 0;
    }

    return NextResponse.json({ type, productsRenamed });
  } catch (error) {
    console.error('[product-types] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update product type' }, { status: 500 });
  }
}

// DELETE /api/product-types/[id]
export async function DELETE(request, { params }) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();

    const type = await ProductType.findById(id);
    if (!type) {
      return NextResponse.json({ error: 'Product type not found' }, { status: 404 });
    }

    // Refuse while products still reference it. Deleting anyway would
    // strand them without a size chart or spec template, and the operator
    // would have no way to tell which products were affected.
    const inUse = await Product.countDocuments({ productType: type.name });
    if (inUse > 0) {
      return NextResponse.json(
        {
          error: `${inUse} product${inUse === 1 ? '' : 's'} still use this type. Move them to another type first, or switch this one off instead.`,
          inUse,
        },
        { status: 409 }
      );
    }

    await ProductType.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[product-types] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete product type' }, { status: 500 });
  }
}
