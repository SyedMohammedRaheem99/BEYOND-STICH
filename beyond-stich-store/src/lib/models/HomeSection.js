import mongoose from 'mongoose';

/**
 * A product section on the home page — "TRENDING NOW", "WINTER EDIT",
 * whatever the operator names it.
 *
 * Generic rather than a hard-coded <TrendingSection>: the first request
 * was for one called Trending, but "or this section XYZ" came with it. A
 * dedicated component would be a smaller change today and a code change
 * every time a second section is wanted.
 *
 * The page renders rows of this collection in `sortOrder`, so adding,
 * renaming, reordering and retiring a section are all operator actions.
 */
const HomeSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: 80,
    },
    subtitle: { type: String, default: '', trim: true, maxlength: 200 },
    /** Small label above the title — "JUST LANDED", "EDITOR'S PICK". */
    eyebrow: { type: String, default: '', trim: true, maxlength: 40 },

    /**
     * How the products are chosen.
     *
     *   manual   an explicit, ordered list (below)
     *   tag      everything carrying a tag — the one to prefer day to day,
     *            because stock and availability stay automatic
     *   segment  everything in one segment
     *   newest   the most recent drops
     *
     * Hand-picking looks like control but rots: pick eight today and in a
     * fortnight three are sold out and the section quietly shows them.
     */
    source: {
      type: String,
      enum: ['manual', 'tag', 'segment', 'newest'],
      default: 'tag',
    },

    /** Used when source is 'manual' — product slugs, in display order. */
    productSlugs: { type: [String], default: [] },
    /** Used when source is 'tag'. */
    tag: { type: String, default: '', trim: true, lowercase: true, maxlength: 40 },
    /** Used when source is 'segment'. */
    segment: { type: String, default: '', trim: true, uppercase: true, maxlength: 40 },

    limit: { type: Number, default: 8, min: 1, max: 24 },

    /**
     * 'grid' wraps onto multiple rows; 'carousel' scrolls horizontally and
     * suits a long list on a phone better.
     */
    layout: { type: String, enum: ['grid', 'carousel'], default: 'grid' },

    /**
     * Optional "view all" destination, so a section can be the landing
     * page for an ad rather than only a strip on the home page.
     */
    linkLabel: { type: String, default: '', trim: true, maxlength: 40 },
    linkHref: { type: String, default: '', trim: true, maxlength: 200 },

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },

    /** Same reasoning as Banner: a seasonal section can retire itself. */
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

HomeSectionSchema.index({ active: 1, sortOrder: 1 });

// A section that selects nothing would render an empty strip on the home
// page, so the selector its source depends on has to be present.
HomeSectionSchema.pre('validate', function () {
  if (this.source === 'tag' && !this.tag) {
    this.invalidate('tag', 'Choose a tag, or change how products are picked');
  }
  if (this.source === 'segment' && !this.segment) {
    this.invalidate('segment', 'Choose a segment, or change how products are picked');
  }
  if (this.source === 'manual' && (!this.productSlugs || this.productSlugs.length === 0)) {
    this.invalidate('productSlugs', 'Pick at least one product, or change how products are picked');
  }
});

export default mongoose.models.HomeSection ||
  mongoose.model('HomeSection', HomeSectionSchema);
