import Coupon from '@/lib/models/Coupon';

// Single source of truth for coupon rules.
//
// /api/coupon/validate is only advisory — the client can skip it and POST any
// discount it likes straight to /api/orders. So the order route must run these
// same checks itself before trusting a discount. Both callers share this.
//
// Assumes connectDB() has already been awaited by the caller.
export async function resolveCoupon(code, subtotal = 0) {
  if (!code || !code.trim()) {
    return { valid: false, discount: 0, freeShipping: false, message: 'Enter a coupon code' };
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();

  if (!coupon || !coupon.active) {
    return { valid: false, discount: 0, freeShipping: false, message: 'Invalid coupon code' };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, discount: 0, freeShipping: false, message: 'This coupon has expired' };
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, freeShipping: false, message: 'This coupon is no longer available' };
  }

  if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
    return {
      valid: false,
      discount: 0,
      freeShipping: false,
      message: `Add ₹${coupon.minOrder - subtotal} more to use this coupon`,
    };
  }

  let discount = 0;
  let freeShipping = false;

  if (coupon.type === 'percent') {
    discount = Math.round((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'flat') {
    discount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'shipping') {
    freeShipping = true;
  }

  // A discount can never exceed what's actually being spent.
  discount = Math.max(0, Math.min(discount, subtotal));

  const label =
    coupon.type === 'percent' ? `${coupon.value}% off`
    : coupon.type === 'flat' ? `₹${coupon.value} off`
    : 'Free shipping';

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discount,
    freeShipping,
    label,
    message: `${coupon.code} applied — ${label}`,
  };
}
