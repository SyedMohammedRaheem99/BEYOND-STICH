import mongoose from 'mongoose';

const SizeStockSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    trim: true,
    // Deliberately NOT an enum. It was ['S','M','L','XL','XXL'], which is a
    // t-shirt's size run — so Mongoose rejected a pant sized '32' or a cap
    // sized 'Free Size' outright. The valid sizes for a product come from
    // its ProductType, which the admin controls; the schema only requires
    // that a size is named.
    maxlength: 20,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
});

/**
 * One row of the product's specification table.
 *
 * Free-form label/value rather than fixed columns: a t-shirt lists GSM and
 * neck type, a pant lists waist rise and closure, a cap lists neither.
 * Hard-coding a field per attribute would mean a schema change for every
 * new kind of product.
 */
const SpecSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false }
);

/**
 * A row of the size chart shown on the product page.
 *
 * `measurements` is a Map so each product type can name its own columns —
 * chest/length/shoulder for a tee, waist/inseam for a pant — without the
 * schema knowing what any of them mean.
 */
const SizeChartRowSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true, maxlength: 20 },
    measurements: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    /**
     * Segment name, matching Segment.name in the segments collection.
     *
     * Deliberately NOT an enum: the list was a fixed 13 here, so adding a
     * world in the admin would have failed validation on every product save.
     * Validity is checked against the live collection in the admin's product
     * routes instead, which is the only place a segment is assigned.
     */
    segment: {
      type: String,
      required: [true, 'Segment is required'],
      uppercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: 0,
    },
    images: {
      type: [String],
      required: true,
      validate: [arr => arr.length >= 1, 'At least one image required'],
    },
    sizes: {
      type: [SizeStockSchema],
      required: true,
    },
    colors: {
      type: [String],
      default: ['Black'],
    },
    /**
     * What kind of product this is — 'T-Shirt', 'Hoodie', 'Pants', 'Cap'…
     *
     * Free-form, matched by name against the ProductType collection, which
     * supplies the default sizes, spec rows and size chart. A string rather
     * than a reference so a product survives its type being renamed or
     * removed, and so seed data needs no lookup.
     */
    productType: {
      type: String,
      default: 'T-Shirt',
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    /**
     * One or two lines for cards, search results and the meta description.
     * Falls back to a truncated `description` when empty, so existing
     * products need no backfill.
     */
    shortDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },

    /** Three to five scannable selling points. Most shoppers read only these. */
    highlights: {
      type: [String],
      default: [],
    },

    /**
     * The specification table. Entirely operator-defined — see SpecSchema.
     */
    specs: {
      type: [SpecSchema],
      default: [],
    },

    /**
     * Per-product size chart. Empty means "use the chart from this
     * product's ProductType", which is the normal case; filling it in
     * covers the one-off whose measurements differ from the house pattern.
     */
    sizeChart: {
      type: [SizeChartRowSchema],
      default: [],
    },

    careInstructions: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    /**
     * Was enum ['Oversized','Super Oversized'] — a t-shirt vocabulary that
     * a hoodie, a pant or a cap cannot satisfy. Now free text, and empty by
     * default so nothing is claimed about a product that has not said.
     */
    fitType: {
      type: String,
      default: '',
      trim: true,
      maxlength: 60,
    },

    /**
     * No default: '240 GSM Cotton' was asserted for every product whether
     * or not it was true, and the admin form had no field to correct it.
     */
    material: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    tags: {
      type: [String],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

  },
  {
    timestamps: true,
  }
);

// Indexes for performance.
// `slug` is not listed here: it already has unique: true on the field, which
// creates the index — declaring it twice triggers a duplicate-index warning.
ProductSchema.index({ segment: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
// Every catalogue query filters on isActive and sorts by createdAt; the
// single-field indexes above can't serve that combination.
ProductSchema.index({ isActive: 1, segment: 1, createdAt: -1 });
// Same shape as the segment index, for browsing by kind of product — the
// single-field index on productType can't serve the isActive + sort
// combination every catalogue query uses.
ProductSchema.index({ isActive: 1, productType: 1, createdAt: -1 });

// Virtual: discount percentage
ProductSchema.virtual('discountPercent').get(function () {
  if (this.mrp > this.price) {
    return Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  return 0;
});

// Virtual: total stock
ProductSchema.virtual('totalStock').get(function () {
  return this.sizes.reduce((sum, s) => sum + s.stock, 0);
});

// Ensure virtuals are included in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
