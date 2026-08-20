import mongoose from 'mongoose';

// Mirrors the admin Coupon schema so both apps read the same collection.
const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'flat', 'shipping'], default: 'percent' },
    value: { type: Number, default: 0, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    description: { type: String, default: '' },
    // Welcome offers are for first-time buyers only. Without this the same
    // customer could claim the 25% code on every order they ever place.
    // Enforced in resolveCoupon() against past orders for that email.
    firstOrderOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
