import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Expected payload fields in real integration
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = body;

    // TODO: Phase 3 (Backend Integration)
    // Verify signature using crypto:
    // const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
    //   .update(razorpay_order_id + "|" + razorpay_payment_id)
    //   .digest('hex');
    // if (generated_signature !== razorpay_signature) throw Error("Invalid sig");

    // For now, always verify successfully.
    return NextResponse.json({ 
      success: true, 
      message: "Payment verified successfully",
      mock_db_order_id: `ORD_${Math.floor(Math.random() * 9999999)}`
    }, { status: 200 });

  } catch (error) {
    console.error("Mock Razorpay Verification Error:", error);
    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 });
  }
}
