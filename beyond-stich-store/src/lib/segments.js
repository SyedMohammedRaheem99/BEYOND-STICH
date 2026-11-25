import connectDB from '@/lib/mongodb';
import Segment from '@/lib/models/Segment';
import { SEGMENTS as FALLBACK_SEGMENTS } from '@/lib/constants';
import { serialise } from '@/lib/serialise';

/**
 * Segments read from the database, with the constants as a fallback.
 *
 * Every caller renders navigation: the home grid, the navbar mega-menu, the
 * footer, /shop filters and the sitemap. An empty array there is not a
 * cosmetic problem — it is a site with no way to browse — so a database
 * failure falls back to the shipped list rather than returning nothing.
 *
 * The fallback shape is normalised to match a database row (`slug` where the
 * constant says `id`, `showInGrid` where it was a hardcoded `randoms`
 * filter), so callers never need to know which source they got.
 */

const normaliseFallback = () =>
  FALLBACK_SEGMENTS.map((s, i) => ({
    _id: s.id,
    slug: s.id,
    name: s.name,
    tagline: s.tagline || '',
    description: s.description || '',
    longDescription: s.longDescription || '',
    accent: s.accent || '',
    icon: '',
    image: '',
    sortOrder: i + 1,
    active: true,
    showInGrid: s.id !== 'randoms',
  }));

/** All live segments, in display order. */
export async function getSegments() {
  try {
    await connectDB();
    const rows = await Segment.find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // An empty collection means the seed has not run yet, not that the
    // owner deleted every world — fall back rather than render no nav.
    if (rows.length === 0) return normaliseFallback();

    return serialise(rows);
  } catch (err) {
    console.error('[segments] could not load, using built-ins:', err.message);
    return normaliseFallback();
  }
}

/** Just the ones that belong on the home page grid. */
export async function getGridSegments() {
  const all = await getSegments();
  return all.filter((s) => s.showInGrid !== false);
}

/**
 * One segment by slug or by name, so a URL (/segment/gym) and a product's
 * stored segment value (GYM) both resolve.
 */
export async function getSegment(key) {
  if (!key) return null;
  const wanted = String(key).toLowerCase();
  const all = await getSegments();
  return (
    all.find((s) => s.slug?.toLowerCase() === wanted) ||
    all.find((s) => s.name?.toLowerCase() === wanted) ||
    null
  );
}

/** Valid segment names, for validating a product's segment. */
export async function getSegmentNames() {
  const all = await getSegments();
  return all.map((s) => s.name);
}
