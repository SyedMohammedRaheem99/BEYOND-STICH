import mongoose from 'mongoose';

// Slug-based items so orders work with local seed products or DB products, and
// guest-friendly (user optional) since checkout is guest for now.
const OrderItemSchema = new mongoose.Schema(
  {
    productSlug: { type: String, default: '' },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    segment: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: '', lowercase: true, trim: true },
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['cod', 'online', 'mock'], default: 'mock' },
    paymentId: { type: String, default: '' },
    razorpayOrderId: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'placed',
    },
    trackingNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: '' },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'processed', 'failed'],
      default: 'none',
    },
    refundInitiatedAt: { type: Date, default: null },

    // Customer-initiated return request. The admin already had refund fields
    // but there was no way for a customer to start the process.
    returnRequest: {
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'completed'],
        default: 'none',
      },
      reason: { type: String, default: '', maxlength: 500 },
      requestedAt: { type: Date, default: null },
      // When the order was marked delivered — the 7-day window runs from here.
      resolvedAt: { type: Date, default: null },
    },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Generate a unique order number (synchronous hook — no `next`, for Mongoose 9)
OrderSchema.pre('validate', function () {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `BS-${timestamp}-${random}`;
  }
});

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
// The account page lists a customer's orders by user and by email (guest
// orders have user: null), and review submission verifies a purchase by
// email + item slug. All three were unindexed collection scans.
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ email: 1, createdAt: -1 });
OrderSchema.index({ 'items.productSlug': 1 });
// The Razorpay webhook and the browser's verify call both look an order up by
// this to avoid creating a duplicate for the same payment. Sparse because COD
// orders never have one.
OrderSchema.index({ razorpayOrderId: 1 }, { sparse: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
