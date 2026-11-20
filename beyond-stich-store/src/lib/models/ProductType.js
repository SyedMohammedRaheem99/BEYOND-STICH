import mongoose from 'mongoose';

/**
 * A kind of product the store sells — T-Shirt, Hoodie, Pants, Cap…
 *
 * Exists so the catalogue is not locked to t-shirts. Sizes used to be an
 * enum of ['S','M','L','XL','XXL'] on Product, which made a pant sized '32'
 * or a cap sized 'Free Size' fail validation outright, and the size chart
 * was hard-coded twice in the storefront.
 *
 * Everything here is a TEMPLATE, never a constraint: adding a product of
 * this type pre-fills its sizes, spec rows and chart, and the operator is
 * free to change any of it on that product. Nothing in the app rejects a
 * product for disagreeing with its type.
 */

const SpecTemplateSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    // The usual answer, pre-filled on the product form. Blank is fine —
    // it just means the row appears empty and waiting.
    defaultValue: { type: String, default: '', trim: true, maxlength: 200 },
  },
  { _id: false }
);

const ChartRowSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true, maxlength: 20 },
    // Keyed by column name so each type names its own measurements —
    // chest/length/shoulder for a tee, waist/inseam for a pant.
    measurements: { type: Map, of: String, default: () => new Map() },
  },
  { _id: false }
);

const ProductTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Type name is required'],
      unique: true,
      trim: true,
      maxlength: 60,
    },

    /** Default size run, in display order. */
    sizes: {
      type: [String],
      default: [],
    },

    specTemplate: {
      type: [SpecTemplateSchema],
      default: [],
    },

    /**
     * Column headings for the size chart, in display order. Stored
     * separately from the rows because a Map has no guaranteed key order,
     * and the table has to render its columns consistently.
     */
    chartColumns: {
      type: [String],
      default: [],
    },

    chartRows: {
      type: [ChartRowSchema],
      default: [],
    },

    /** Shown above the chart — "Measurements are of the garment, laid flat." */
    chartNote: { type: String, default: '', trim: true, maxlength: 300 },

    /** Explains how each measurement is taken. */
    measureGuide: {
      type: [SpecTemplateSchema],
      default: [],
    },

    /** Lower numbers first in the admin's type list. */
    sortOrder: { type: Number, default: 0 },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// `name` is not re-indexed: unique: true on the field already creates it.
ProductTypeSchema.index({ active: 1, sortOrder: 1 });

export default mongoose.models.ProductType ||
  mongoose.model('ProductType', ProductTypeSchema);
