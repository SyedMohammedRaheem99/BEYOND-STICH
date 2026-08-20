import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    // percent: % off subtotal | flat: ₹ off subtotal | shipping: free shipping
    type: {
      type: String,
      required: true,
      enum: ['percent', 'flat', 'shipping'],
      default: 'percent',
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
    minOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Optional cap on percent discounts (0 = no cap)
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // 0 = unlimited
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    // Restricts the coupon to a customer's first order. Checked on the
    // storefront against past orders for that email — without it a welcome
    // discount can be claimed on every order forever.
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
