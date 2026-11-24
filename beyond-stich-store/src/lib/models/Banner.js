import mongoose from 'mongoose';

/**
 * A slide in one of the site's carousels.
 *
 * Banners used to live in src/lib/banners.js as exported constants, so
 * changing a headline — or running a weekend offer — meant a code edit and
 * a deploy. They are rows now, editable in the admin.
 *
 * `placement` keeps the home hero and the shop banner in one collection:
 * the two carousels are the same shape and sharing the model means one
 * admin screen manages both.
 */
const BannerSchema = new mongoose.Schema(
  {
    placement: {
      type: String,
      enum: ['home-hero', 'shop-hero'],
      default: 'home-hero',
      index: true,
    },

    /** Internal label, shown only in the admin list. */
    name: { type: String, default: '', trim: true, maxlength: 80 },

    /**
     * Separate crops, not one image scaled: the desktop frame is a wide
     * letterbox and the mobile one is portrait, so a single file would
     * crop the subject out of frame on one of them.
     */
    desktopImage: { type: String, required: true },
    mobileImage: { type: String, default: '' },

    badge: { type: String, default: '', trim: true, maxlength: 40 },
    /** A newline here renders as a line break in the headline. */
    headline: { type: String, default: '', trim: true, maxlength: 200 },
    subheadline: { type: String, default: '', trim: true, maxlength: 300 },

    ctaLabel: { type: String, default: '', trim: true, maxlength: 40 },
    ctaHref: { type: String, default: '/shop', trim: true, maxlength: 200 },

    /**
     * Coupon code advertised on the slide. Validated against the Coupon
     * collection in the admin before saving — a banner promising a code
     * that does not exist sends customers to "Invalid coupon code" at
     * checkout, which is worse than no offer at all.
     */
    code: { type: String, default: '', trim: true, uppercase: true, maxlength: 40 },

    /**
     * Accent colour, used by the shop banner for the overlay tint and the
     * CTA. Hex validated so a typo cannot emit invalid CSS, which would
     * silently fall back to the inherited colour and look like a bug.
     * Blank means "use the brand accent from globals.css".
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

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },

    /**
     * Optional scheduling. Null on either side means "no bound", so a
     * permanent banner needs neither. Lets a sale banner appear and retire
     * itself without anyone remembering to switch it off.
     */
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Every read is "the live slides for this carousel, in order".
BannerSchema.index({ placement: 1, active: 1, sortOrder: 1 });

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
