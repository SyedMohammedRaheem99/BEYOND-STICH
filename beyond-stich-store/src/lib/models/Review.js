import mongoose from 'mongoose';

// Slug-keyed so reviews work whether products are local seed data or DB records,
// and guest-friendly so customers can review before full auth exists. `approved`
// enables admin moderation; `verified` marks a confirmed buyer.
const ReviewSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true, trim: true, lowercase: true },
    authorName: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    authorEmail: { type: String, default: '', lowercase: true, trim: true },
    rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 100 },
    body: { type: String, required: [true, 'Review text is required'], trim: true, maxlength: 1000 },
    images: {
      type: [String],
      default: [],
      validate: [(arr) => arr.length <= 5, 'Maximum 5 review images'],
    },
    verified: { type: Boolean, default: false },
    approved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ productSlug: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
