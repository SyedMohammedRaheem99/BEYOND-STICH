import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// POST /api/razorpay/order
// Creates a real Razorpay order and returns the order_id for the frontend checkout.
export async function POST(request) {
  try {
    const { amount, currency = 'INR', notes = {} } = await request.json();

    if (!amount || typeof amount !== 'number' || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If keys not configured, return a mock order so devs can still test the UI
    if (!keyId || keyId === 'your_razorpay_key_id') {
      const mockOrder = {
        id: `mock_order_${Math.floor(Math.random() * 1_000_000)}`,
        amount: amount * 100,
        currency,
        mock: true,
      };
      return NextResponse.json({ success: true, order: mockOrder });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('[razorpay/order] Error:', error);
    return NextResponse.json({ success: false, error: 'Payment initiation failed' }, { status: 500 });
  }
}
