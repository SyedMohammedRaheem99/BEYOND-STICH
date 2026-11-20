import Product from '@/lib/models/Product';

/**
 * Put an order's units back on the shelf.
 *
 * Checkout reserves stock atomically when the order is created (see the
 * storefront's lib/orderIntegrity.js — reserveStock). Nothing ever reversed
 * that: cancelling an order only rewrote a status string, so the units stayed
 * subtracted forever. After a handful of cancellations the catalogue shows
 * SOLD OUT for sizes that are physically in stock, and the lost sales are
 * invisible because nothing errors.
 *
 * Matched on productSlug + size, the same keys checkout decrements, so a
 * product renamed since the order was placed still resolves.
 *
 * Returns { restored, skipped } rather than throwing: a status change must
 * not fail because one line referenced a product that has since been
 * deleted.
 */
export async function restoreStock(items = []) {
  let restored = 0;
  const skipped = [];

  for (const item of items) {
    const slug = item.productSlug || item.slug;
    const size = item.size;
    const qty = Math.max(0, parseInt(item.quantity, 10) || 0);

    if (!slug || !size || qty === 0) {
      skipped.push({ slug: slug || '(unknown)', size, reason: 'incomplete line' });
      continue;
    }

    try {
      const res = await Product.updateOne(
        { slug, 'sizes.size': size },
        { $inc: { 'sizes.$.stock': qty } }
      );

      if (res.modifiedCount === 1) {
        restored += qty;
      } else {
        // The product or that size no longer exists. Worth surfacing — the
        // units are real and someone has to decide where they go.
        skipped.push({ slug, size, qty, reason: 'product or size not found' });
      }
    } catch (err) {
      skipped.push({ slug, size, qty, reason: err.message });
    }
  }

  if (skipped.length) {
    console.warn('[stock] could not restore some lines:', skipped);
  }

  return { restored, skipped };
}
