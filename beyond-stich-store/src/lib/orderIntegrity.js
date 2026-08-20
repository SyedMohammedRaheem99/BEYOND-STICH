import Product from '@/lib/models/Product';
import { resolveCoupon } from '@/lib/coupon';
import { SHIPPING } from '@/lib/constants';

export const MAX_ITEMS = 50;

// Thrown for problems the customer can act on (out of stock, item removed) so
// they surface as a clear 409 instead of a generic 500.
export class OrderError extends Error {}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

// Returns an error string, or null when the address is usable for delivery.
export function validateShippingAddress(addr) {
  if (!addr || typeof addr !== 'object') return 'Shipping address is incomplete';

  const fullName = String(addr.fullName || '').trim();
  const street = String(addr.street || '').trim();
  const city = String(addr.city || '').trim();
  const pincode = String(addr.pincode || '').trim();
  const phone = String(addr.phone || '').replace(/\D/g, '');

  if (fullName.length < 2 || fullName.length > 100) return 'Enter your full name';
  if (street.length < 5 || street.length > 300) return 'Enter a complete street address';
  if (city.length < 2 || city.length > 100) return 'Enter your city';
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return 'Enter a valid 6-digit pincode';
  // A COD parcel with no reachable phone can't be delivered.
  if (!/^[6-9][0-9]{9}$/.test(phone)) return 'Enter a valid 10-digit mobile number';

  return null;
}

// Only persist the address fields we know about, with lengths bounded.
export function pickShippingAddress(addr) {
  return {
    fullName: String(addr.fullName || '').trim().slice(0, 100),
    street: String(addr.street || '').trim().slice(0, 300),
    city: String(addr.city || '').trim().slice(0, 100),
    state: String(addr.state || '').trim().slice(0, 100),
    pincode: String(addr.pincode || '').trim().slice(0, 10),
    phone: String(addr.phone || '').replace(/\D/g, '').slice(0, 15),
  };
}

// Re-price every line from the database and confirm stock exists.
// Throws OrderError for anything the customer needs to resolve. A failed
// lookup rejects the order rather than trusting the submitted price —
// failing open here would silently disable the anti-tampering control.
export async function repriceItems(items) {
  return Promise.all(
    items.map(async (i) => {
      const slug = i.productSlug || i.slug || '';
      const size = i.size || '';
      const quantity = Math.max(1, parseInt(i.quantity, 10) || 1);

      if (!slug) throw new OrderError('One of your items is no longer available');

      const dbProduct = await Product.findOne({ slug, isActive: true })
        .select('name price sizes')
        .lean();

      if (!dbProduct) {
        throw new OrderError(`"${i.name || 'An item'}" is no longer available`);
      }

      const sizeRow = (dbProduct.sizes || []).find((s) => s.size === size);
      if (!sizeRow || sizeRow.stock < quantity) {
        throw new OrderError(`${dbProduct.name} (${size || 'selected size'}) is out of stock`);
      }

      return {
        productSlug: slug,
        name: String(dbProduct.name || '').slice(0, 200),
        image: String(i.image || '').slice(0, 500),
        size: String(size).slice(0, 20),
        color: String(i.color || '').slice(0, 50),
        segment: String(i.segment || '').slice(0, 50),
        quantity,
        price: dbProduct.price,
      };
    })
  );
}

// Compute authoritative money values. Discounts and shipping are business
// rules, never client inputs.
export async function computeTotals(pricedItems, couponCode, email = '') {
  const subtotal = pricedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let discount = 0;
  let freeShipping = false;
  let appliedCouponCode = '';

  if (couponCode && couponCode.trim()) {
    // Email is needed so first-order-only offers can be enforced.
    const resolved = await resolveCoupon(couponCode, subtotal, email);
    if (resolved.valid) {
      discount = resolved.discount;
      freeShipping = resolved.freeShipping;
      appliedCouponCode = resolved.code;
    }
  }

  const afterDiscount = subtotal - discount;
  const shipping = freeShipping || afterDiscount >= SHIPPING.FREE_THRESHOLD
    ? 0
    : SHIPPING.FLAT_RATE;

  return { subtotal, discount, shipping, total: afterDiscount + shipping, appliedCouponCode };
}

// Atomically reserve stock for every line. The filter requires enough stock to
// still be present, so two simultaneous checkouts for the last tee can't both
// succeed. Returns null on success, or the line that sold out (after rolling
// back anything already reserved).
export async function reserveStock(pricedItems) {
  const reserved = [];

  for (const i of pricedItems) {
    const res = await Product.updateOne(
      { slug: i.productSlug, sizes: { $elemMatch: { size: i.size, stock: { $gte: i.quantity } } } },
      { $inc: { 'sizes.$.stock': -i.quantity } }
    );

    if (res.modifiedCount !== 1) {
      await releaseStock(reserved);
      return i;
    }
    reserved.push(i);
  }

  return null;
}

// Put reserved stock back — used when the order write fails after reserving.
export async function releaseStock(items) {
  for (const r of items) {
    await Product.updateOne(
      { slug: r.productSlug, 'sizes.size': r.size },
      { $inc: { 'sizes.$.stock': r.quantity } }
    ).catch(() => {});
  }
}
