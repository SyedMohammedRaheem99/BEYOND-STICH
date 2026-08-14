import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Review from '@/lib/models/Review';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 1. Daily Revenue Time Series
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Top 10 Products by units sold
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          units: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          segment: { $first: '$items.segment' },
        },
      },
      { $sort: { units: -1 } },
      { $limit: 10 },
    ]);

    // 3. Segment Revenue Breakdown
    const segmentBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.segment',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          units: { $sum: '$items.quantity' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // 4. Order Counts by Status
    const statusCounts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    // 5. Summary KPIs
    const kpiAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        },
      },
    ]);

    const kpi = kpiAgg[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    // 6. Total products & pending reviews counts
    const totalProducts = await Product.countDocuments({});
    const pendingReviews = await Review.countDocuments({ approved: true, verified: false });

    return NextResponse.json({
      period: days,
      kpi: {
        totalRevenue: Math.round(kpi.totalRevenue),
        totalOrders: kpi.totalOrders,
        avgOrderValue: Math.round(kpi.avgOrderValue),
        totalProducts,
        pendingReviews,
      },
      dailyRevenue,
      topProducts,
      segmentBreakdown,
      statusCounts,
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
