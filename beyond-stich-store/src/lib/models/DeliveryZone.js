import mongoose from 'mongoose';

/**
 * A block of PIN codes the store delivers to, described as a prefix range.
 *
 * Indian PIN codes are allocated geographically — the first two digits are
 * a postal circle, the first three a sorting district — so coverage is
 * naturally expressed as ranges rather than as ~19,300 individual rows.
 *
 * Ranges rather than a full pincode table, for two reasons:
 *
 *  1. We do not have an authoritative list of which PIN codes exist. Any
 *     generated one would mark tens of thousands of non-existent codes as
 *     serviceable, which is the same "accepts any 6 digits" bug this work
 *     is meant to remove, just with extra steps.
 *  2. A courier's coverage genuinely is regional. Describing it as ~30
 *     editable rows is something an operator can reason about; 19,300 rows
 *     is not.
 *
 * Individual exceptions live in the Pincode collection, which is checked
 * first and can both add and remove a single code.
 */
const DeliveryZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Inclusive bounds, stored as numbers so a range check is a plain
    // numeric comparison rather than string work on every lookup.
    rangeStart: {
      type: Number,
      required: true,
      min: 100000,
      max: 999999,
    },
    rangeEnd: {
      type: Number,
      required: true,
      min: 100000,
      max: 999999,
    },

    state: { type: String, default: '', trim: true },

    zone: {
      type: String,
      enum: ['local', 'metro', 'tier1', 'tier2', 'remote'],
      default: 'tier2',
    },

    // Null means "use the zone default" (see lib/serviceability.js).
    deliveryDaysMin: { type: Number, default: null, min: 0 },
    deliveryDaysMax: { type: Number, default: null, min: 0 },

    // Some regions are reachable but COD-risky. Turning COD off keeps the
    // area serviceable for prepaid orders instead of losing the sale.
    codAvailable: { type: Boolean, default: true },

    active: { type: Boolean, default: true },

    notes: { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true }
);

// Every lookup asks "which active range contains this number", so the
// range bounds carry the index.
DeliveryZoneSchema.index({ active: 1, rangeStart: 1, rangeEnd: 1 });

DeliveryZoneSchema.pre('validate', function () {
  if (this.rangeEnd < this.rangeStart) {
    this.invalidate('rangeEnd', 'Range end must be greater than or equal to range start');
  }
});

export default mongoose.models.DeliveryZone ||
  mongoose.model('DeliveryZone', DeliveryZoneSchema);
