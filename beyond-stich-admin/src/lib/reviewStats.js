import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product';

/**
 * Recompute a product's cached rating from its approved reviews.
 *
 * Two places show a rating and they used to disagree. The product page
 * computes it live from approved reviews — correct, and deliberately so,
 * because advertising an aggregateRating with no genuine on-page reviews
 * risks a Google manual action. But ProductCard, on every listing and grid,
 * reads the cached `averageRating` field on the product, which nothing ever
 * updated: it shipped non-zero on seeded products and never moved again.
 *
 * Now that the admin can create, edit and re-rate reviews, that gap would
 * widen every time someone touched one. Called after any write that can
 * change the set of approved reviews for a product.
 *
 * Deliberately never throws: a stale cached rating is a cosmetic problem,
 * but a failed review save because of a stats update is a real one.
 */
export async function recalcProductRating(productSlug) {
  if (!productSlug) return;

  try {
    const [stats] = await Review.aggregate([
      { $match: { productSlug, approved: true } },
      {
        $group: {
          _id: '$productSlug',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    // No approved reviews means no rating — zero, not the previous value,
    // or deleting the last review would leave its stars behind.
    const average = stats ? Math.round(stats.average * 10) / 10 : 0;
    const count = stats ? stats.count : 0;

    await Product.updateOne(
      { slug: productSlug },
      { $set: { averageRating: average, reviewCount: count } }
    );
  } catch (err) {
    console.error('[reviewStats] could not recalc', productSlug, err.message);
  }
}

export default recalcProductRating;
