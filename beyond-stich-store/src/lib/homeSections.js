import connectDB from '@/lib/mongodb';
import HomeSection from '@/lib/models/HomeSection';
import Banner from '@/lib/models/Banner';
import Product from '@/lib/models/Product';
import { serialiseProducts, serialise } from '@/lib/serialise';

/**
 * Reads the operator-managed home page: its banner slides and its product
 * sections, each resolved to real products.
 *
 * Assumes nothing about what the sections are called or how many exist —
 * the page renders whatever is configured.
 */

// Only the fields ProductCard renders. Without this the full description,
// specs and size chart of every product are serialised into the HTML.
const CARD_FIELDS =
  'name slug price mrp images segment productType fitType colors sizes tags averageRating reviewCount createdAt';

/** True when now is inside a row's optional schedule. */
function isLive(row, now = Date.now()) {
  if (row.active === false) return false;
  if (row.startsAt && new Date(row.startsAt).getTime() > now) return false;
  if (row.endsAt && new Date(row.endsAt).getTime() < now) return false;
  return true;
}

/**
 * Resolve one section's products.
 *
 * Every branch filters on isActive, so a product pulled from sale
 * disappears from every section without anyone editing them.
 */
async function resolveProducts(section) {
  const limit = Math.min(Math.max(section.limit || 8, 1), 24);

  if (section.source === 'manual') {
    const slugs = section.productSlugs || [];
    if (slugs.length === 0) return [];

    const docs = await Product.find({ slug: { $in: slugs }, isActive: true })
      .select(CARD_FIELDS)
      .lean();

    // Mongo returns these in its own order; the operator chose theirs, so
    // restore it rather than showing a list they did not arrange.
    const bySlug = new Map(docs.map((d) => [d.slug, d]));
    return slugs.map((s) => bySlug.get(s)).filter(Boolean).slice(0, limit);
  }

  const filter = { isActive: true };
  if (section.source === 'tag') filter.tags = section.tag;
  if (section.source === 'segment') filter.segment = section.segment;

  return Product.find(filter)
    .select(CARD_FIELDS)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Every live section, in order, with its products already resolved.
 *
 * Returns [] on a database error rather than throwing: the home page
 * still has its hero, trust bar and manifesto, and a missing strip is a
 * better outcome than a 500 on the store's front door.
 */
export async function getHomeSections() {
  try {
    await connectDB();

    const rows = await HomeSection.find({ active: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    const live = rows.filter((r) => isLive(r));

    const resolved = await Promise.all(
      live.map(async (section) => ({
        ...serialise(section),
        products: serialiseProducts(await resolveProducts(section)),
      }))
    );

    // A section whose tag matches nothing would render a heading above an
    // empty row, which reads as broken rather than as empty.
    return resolved.filter((s) => s.products.length > 0);
  } catch (err) {
    console.error('[homeSections] could not load sections:', err.message);
    return [];
  }
}

/**
 * Live slides for one carousel, in order.
 *
 * Returns [] on error; HeroSection falls back to its built-in slides so
 * the page never opens on an empty frame.
 */
export async function getBanners(placement = 'home-hero') {
  try {
    await connectDB();

    const rows = await Banner.find({ placement, active: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return serialise(rows.filter((r) => isLive(r)));
  } catch (err) {
    console.error('[homeSections] could not load banners:', err.message);
    return [];
  }
}
