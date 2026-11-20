import mongoose from 'mongoose';

/**
 * A record of every message this store tries to send.
 *
 * Shared-hosting SMTP gives no delivery dashboard, so without this there is
 * no way to answer "did the customer get their OTP?" — the single most
 * common support question once email gates signup. Three signals are
 * captured, in increasing order of strength:
 *
 *   status: 'sent'      the SMTP server accepted the message. Proves it left
 *                       us; proves nothing about the inbox.
 *   status: 'failed'    the server rejected it, or the connection died.
 *                       Usually a bad address or a rate limit.
 *   openedAt            the tracking pixel loaded. This is hard evidence the
 *                       message reached an inbox rather than a spam folder.
 *
 * Open tracking undercounts (many clients block remote images by default),
 * so a missing openedAt is not proof of failure — but a present one IS proof
 * of delivery. Read it as a floor, never a ceiling.
 */
const EmailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, lowercase: true, trim: true, index: true },
    subject: { type: String, default: '' },
    // Logical message kind: 'otp' | 'password-reset' | 'order-confirmation' …
    // Lets us ask "what share of OTPs get opened?" separately from marketing.
    type: { type: String, default: 'other', index: true },

    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true,
    },

    // The upstream message id, so a log line can be matched against the mail
    // server's own records when debugging with the host.
    messageId: { type: String, default: '' },
    // Raw SMTP acceptance info, useful when a provider partially accepts.
    accepted: { type: [String], default: [] },
    rejected: { type: [String], default: [] },
    // Populated on failure — the actual reason, not a generic string.
    error: { type: String, default: '' },

    openedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// The admin view lists newest-first, optionally filtered by type/status.
EmailLogSchema.index({ createdAt: -1 });
EmailLogSchema.index({ type: 1, status: 1, createdAt: -1 });

// Logs are diagnostics, not records of account. Ninety days is long enough to
// investigate a complaint and short enough that this collection can't grow
// without bound on a shared cluster.
EmailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.EmailLog || mongoose.model('EmailLog', EmailLogSchema);
