import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = "INR" } = body;

    // TODO: Phase 3 (Backend Integration)
    // When Razorpay keys are provided, initialize Razorpay instance
    // const razorpay = new Razorpay({ key_id: ..., key_secret: ... });
    // const order = await razorpay.orders.create({ amount: amount * 100, currency });
    
    // For now, return a mock order response
    const mockOrder = {
      id: `mock_order_${Math.floor(Math.random() * 1000000)}`,
      amount: amount * 100,
      currency: currency,
    };

    return NextResponse.json({ success: true, order: mockOrder }, { status: 200 });

  } catch (error) {
    console.error("Mock Razorpay Order Error:", error);
    return NextResponse.json({ success: false, error: "Payment initiation failed" }, { status: 500 });
  }
}
