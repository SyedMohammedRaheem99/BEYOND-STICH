import mongoose from 'mongoose';

const SizeStockSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
});

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
    segment: {
      type: String,
      required: [true, 'Segment is required'],
      enum: [
        'GYM', 'COFFEE', 'MILLIONAIRE', 'MUSIC', 'GAMER',
        'CARS', 'BIKE', 'SUMMER', 'FLORAL', 'SPORTS',
        'VALENTINE', 'TYPOGRAPHY', 'RANDOMS',
      ],
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
    description: {
      type: String,
      required: true,
    },
    fitType: {
      type: String,
      enum: ['Oversized', 'Super Oversized'],
      default: 'Oversized',
    },
    material: {
      type: String,
      default: '240 GSM Cotton',
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
