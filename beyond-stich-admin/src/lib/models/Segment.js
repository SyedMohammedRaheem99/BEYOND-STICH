import mongoose from 'mongoose';

/**
 * A "world" — GYM, COFFEE, GAMER and so on.
 *
 * These were a hardcoded array of 13 in constants.js, duplicated across both
 * apps, which meant opening a new world needed a code change and a deploy.
 * They drive the home page grid, the navbar mega-menu, the footer, /shop
 * filters, every /segment/[name] page and the sitemap, so the shape here has
 * to carry everything those pages render.
 *
 * `slug` is the URL and the stable identity. `name` is what a customer sees
 * and what Product.segment stores, so renaming a segment is deliberately a
 * two-step job (see the note on `name` below).
 */
const SegmentSchema = new mongoose.Schema(
  {
    // URL segment: /segment/gym. Lower-case, no spaces.
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Use lower-case letters, numbers and hyphens only'],
    },

    /**
     * Display name, and the value stored on Product.segment.
     *
     * Products reference a segment by this string rather than by ObjectId,
     * which is how the data already works — changing that would mean
     * rewriting every existing product. The practical consequence: renaming
     * a segment must also update its products, so the admin does both in one
     * operation rather than letting them drift apart.
     */
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 40,
    },

    tagline: { type: String, default: '', trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 300 },

    // Long-form copy for the segment landing page. This is real SEO content
    // and the existing values run to ~700 characters.
    longDescription: { type: String, default: '', trim: true, maxlength: 4000 },

    /**
     * Accent colour. Validated as a 6-digit hex so a typo cannot emit
     * invalid CSS, which would silently inherit the parent colour and read
     * as a styling bug rather than an error. Blank means "use the brand
     * accent", which is the direction the site is moving in — a different
     * neon per world reads as gaming rather than premium.
     */
    accent: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: (v) => !v || /^#[0-9a-fA-F]{6}$/.test(v),
        message: 'Accent must be a 6-digit hex colour like #F5C518',
      },
    },

    // Optional icon key, replacing the plain colour dot in the segment grid.
    icon: { type: String, default: '', trim: true, maxlength: 40 },

    // Optional artwork for the segment tile and landing page.
    image: { type: String, default: '' },

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },

    /**
     * RANDOMS is excluded from the home page grid but still exists as a
     * real world with its own page. That rule was a hardcoded
     * `filter(s => s.id !== 'randoms')`; making it a field means any
     * segment can be hidden from the grid without touching code.
     */
    showInGrid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ordering is by sortOrder everywhere these are listed.
SegmentSchema.index({ active: 1, sortOrder: 1 });

export default mongoose.models.Segment || mongoose.model('Segment', SegmentSchema);
