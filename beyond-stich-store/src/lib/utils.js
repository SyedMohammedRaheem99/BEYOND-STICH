// --------------------------------------------------------------------------
// Pure Business Logic Helpers
// Safe to import in both Client and Server Components.
// Contains no Node-specific (e.g. Mongoose, fs) dependencies.
// --------------------------------------------------------------------------

export function discountPercent(product) {
  if (!product || product.mrp <= product.price) return 0;
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

export function totalStock(product) {
  if (!product?.sizes) return 0;
  return product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
}

export function isInStock(product) {
  return totalStock(product) > 0;
}
