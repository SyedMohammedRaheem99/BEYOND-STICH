import mongoose from 'mongoose';

// A customer asking to be told when a sold-out size comes back.
// Without this the store loses both the sale and the demand signal: an
// out-of-stock size was simply a disabled button with nowhere to go.
const StockNotificationSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true, lowercase: true, trim: true },
    size: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One request per person per variant.
StockNotificationSchema.index(
  { productSlug: 1, size: 1, email: 1 },
  { unique: true }
);
// Lets the admin pull "who is waiting on this variant" when restocking.
StockNotificationSchema.index({ productSlug: 1, notified: 1 });

export default mongoose.models.StockNotification ||
  mongoose.model('StockNotification', StockNotificationSchema);
