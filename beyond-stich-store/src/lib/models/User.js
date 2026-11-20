import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    passwordHash: {
      type: String,
      select: false, // Don't return password by default
    },
    image: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    resetToken: {
      type: String,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      select: false,
    },

    // --- Email verification ---
    // Until this is true we have no evidence the person signing up actually
    // owns this address. That matters beyond spam: guest orders are keyed by
    // email alone, so claiming them for an unverified account would hand a
    // stranger another customer's name, phone and shipping address.
    //
    // Google accounts are verified by Google itself, so they skip the OTP
    // flow entirely (set true in the signIn callback).
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // Only the SHA-256 hash of the 6-digit code is stored, same as the reset
    // token — a leaked DB dump can't be used to verify anyone's account.
    otpHash: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    // A 6-digit code is only a million guesses, which is trivial to brute
    // force without a ceiling. Hitting the cap invalidates the code and
    // forces a resend.
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    // Rate-limits "resend code" per account. The in-memory limiter in
    // rateLimit.js is per-instance, so it can't be trusted alone on
    // serverless — this is the durable check.
    otpLastSentAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// `email` is not indexed here: unique: true on the field already creates it,
// and declaring it twice triggers a duplicate-index warning.
// Password reset looks users up by token on every attempt — that was a full
// collection scan on a public endpoint.
UserSchema.index({ resetToken: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
