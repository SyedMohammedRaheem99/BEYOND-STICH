import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import { getAdminFromRequest } from '@/lib/auth';

// GET /api/users — List all users with filters
export async function GET(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;

    let query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name email phone role provider image createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get order counts for each user
    const userIds = users.map(u => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
    ]);

    const orderMap = {};
    orderCounts.forEach(o => { orderMap[o._id.toString()] = { count: o.count, totalSpent: o.totalSpent }; });

    const usersWithOrders = users.map(u => ({
      ...u,
      orderCount: orderMap[u._id.toString()]?.count || 0,
      totalSpent: orderMap[u._id.toString()]?.totalSpent || 0,
    }));

    return NextResponse.json({ users: usersWithOrders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
