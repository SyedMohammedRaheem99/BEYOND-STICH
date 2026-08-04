import mongoose from 'mongoose';

// Mirrors the storefront Review schema so both apps read the same collection.
const ReviewSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true, trim: true, lowercase: true },
    authorName: { type: String, required: true, trim: true, maxlength: 60 },
    authorEmail: { type: String, default: '', lowercase: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    images: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    approved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ productSlug: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
