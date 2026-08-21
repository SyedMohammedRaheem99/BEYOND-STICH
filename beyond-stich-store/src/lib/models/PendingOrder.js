import mongoose from 'mongoose';

/**
 * The cart as it stood when a Razorpay order was created.
 *
 * Razorpay's webhook tells us a payment succeeded, but it can't tell us what
 * was in the basket — and its `notes` field (15 keys, 256 chars each) is far
 * too small to carry one. Without this, a customer whose connection drops
 * after paying but before the browser reaches /api/razorpay/verify would have
 * their money taken and no order created.
 *
 * Written when the Razorpay order is created, consumed by whichever finishes
 * first (the browser or the webhook), and expired automatically after a day.
 */
const PendingOrderSchema = new mongoose.Schema(
  {
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    items: { type: Array, default: [] },
    shippingAddress: { type: Object, default: null },
    email: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Set once an Order has been created from this, so the browser and the
    // webhook can't both create one.
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Abandoned checkouts shouldn't accumulate forever. Mongo drops these ~24h
// after creation; a payment that hasn't settled by then needs manual review
// anyway.
PendingOrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.PendingOrder ||
  mongoose.model('PendingOrder', PendingOrderSchema);
