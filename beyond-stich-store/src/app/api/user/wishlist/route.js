import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';

// GET /api/user/wishlist — get populated wishlist
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .populate('wishlist', 'name slug segment price mrp images sizes isActive')
      .lean();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ wishlist: user.wishlist || [] });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

// PUT /api/user/wishlist — sync wishlist (replace with product IDs)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slugs } = await request.json();

    if (!Array.isArray(slugs)) {
      return NextResponse.json({ error: 'slugs must be an array' }, { status: 400 });
    }

    await connectDB();

    // Convert slugs to product IDs
    const products = await Product.find({ slug: { $in: slugs } }).select('_id').lean();
    const productIds = products.map(p => p._id);

    await User.findByIdAndUpdate(session.user.id, { wishlist: productIds });

    return NextResponse.json({ synced: productIds.length });
  } catch (error) {
    console.error('Wishlist PUT error:', error);
    return NextResponse.json({ error: 'Failed to sync wishlist' }, { status: 500 });
  }
}
