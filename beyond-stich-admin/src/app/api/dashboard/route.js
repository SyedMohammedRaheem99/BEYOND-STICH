import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Revenue counts an order once the money is actually in hand: an online
    // order marked paid, or a COD order that has been delivered. Filtering on
    // paymentStatus: 'paid' alone reported zero, because nothing ever moves a
    // COD order to 'paid' — so the entire COD business was invisible here.
    // 1. Today's Revenue
    const revenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod', orderStatus: 'delivered' }] } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);

    const todayRevenue = revenueAgg[0]?.total || 0;
    const todayOrders = revenueAgg[0]?.count || 0;

    // Yesterday's Revenue (for comparison)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    const yesterdayAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }, $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod', orderStatus: 'delivered' }] } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const yesterdayRevenue = yesterdayAgg[0]?.total || 0;

    const revenueChange = yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : todayRevenue > 0 ? 100 : 0;

    // 2. Active Orders (not delivered or cancelled)
    const activeOrders = await Order.countDocuments({
      orderStatus: { $nin: ['delivered', 'cancelled', 'returned'] },
    });

    const pendingDispatch = await Order.countDocuments({
      orderStatus: { $in: ['placed', 'confirmed'] },
    });

    // 3. Low Stock Alerts
    const allProducts = await Product.find({}).lean();
    const lowStockProducts = allProducts.filter(p => {
      const total = p.sizes.reduce((sum, s) => sum + s.stock, 0);
      return total > 0 && total <= 10;
    });

    const outOfStockProducts = allProducts.filter(p =>
      p.sizes.every(s => s.stock === 0)
    );

    // 4. Segment Performance (last 7 days) — items carry the segment directly.
    const segmentAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod', orderStatus: 'delivered' }] } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.segment',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          units: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 },
    ]);

    // 5. Recent Orders (latest 5)
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .lean();

    return NextResponse.json({
      revenue: {
        today: todayRevenue,
        todayOrders,
        changePercent: revenueChange,
      },
      orders: {
        active: activeOrders,
        pendingDispatch,
      },
      stock: {
        lowCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalProducts: allProducts.length,
      },
      segmentPerformance: segmentAgg,
      recentOrders: recentOrders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        customer: o.user?.name || o.shippingAddress?.fullName || 'Guest',
        total: o.total,
        status: o.orderStatus,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
