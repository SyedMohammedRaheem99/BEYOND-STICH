import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

// GET /api/user/addresses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('addresses').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ addresses: user.addresses || [] });
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/user/addresses — add a new address
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, street, city, state, pincode, isDefault } = body;

    if (!fullName || !phone || !street || !city || !state || !pincode) {
      return NextResponse.json({ error: 'All address fields are required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // If this is set as default, unset all others
    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    // If it's the first address, make it default
    const makeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({ fullName, phone, street, city, state, pincode, isDefault: makeDefault });
    await user.save();

    return NextResponse.json({ addresses: user.addresses }, { status: 201 });
  } catch (error) {
    console.error('Address POST error:', error);
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}

// PUT /api/user/addresses — update an address by _id
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { addressId, fullName, phone, street, city, state, pincode, isDefault } = body;

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const addr = user.addresses.id(addressId);
    if (!addr) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    if (fullName) addr.fullName = fullName;
    if (phone) addr.phone = phone;
    if (street) addr.street = street;
    if (city) addr.city = city;
    if (state) addr.state = state;
    if (pincode) addr.pincode = pincode;

    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
      addr.isDefault = true;
    }

    await user.save();
    return NextResponse.json({ addresses: user.addresses });
  } catch (error) {
    console.error('Address PUT error:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE /api/user/addresses
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.addresses.pull(addressId);
    await user.save();

    return NextResponse.json({ addresses: user.addresses });
  } catch (error) {
    console.error('Address DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
