import { Suspense } from 'react';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';
import ShopClient from './ShopClient';

export default async function ShopPage() {
  let products = [];

  try {
    await connectDB();
    const docs = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    products = docs.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }));
  } catch {
    // Fallback to dummy data when DB is unavailable
    products = DUMMY_PRODUCTS.map((p) => ({
      ...p,
      _id: p._id || p.slug,
    }));
  }

  return (
    <Suspense fallback={null}>
      <ShopClient initialProducts={products} />
    </Suspense>
  );
}
