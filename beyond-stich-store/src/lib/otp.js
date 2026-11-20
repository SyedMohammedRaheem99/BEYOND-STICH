import crypto from 'node:crypto';

/**
 * Signup email-verification codes.
 *
 * Only the SHA-256 hash of a code is ever stored, the same way reset tokens
 * are handled — a leaked database dump must not let anyone verify an account
 * they don't own.
 */

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
// A 6-digit code is only a million possibilities. Without a ceiling on
// guesses it is trivially brute-forced, which would defeat the whole point
// of verifying ownership.
export const OTP_MAX_ATTEMPTS = 5;
// Stops "resend" being used to mail-bomb an address, and stops a caller
// refreshing the code to dodge the attempt counter.
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * A cryptographically random 6-digit code.
 *
 * randomInt is used rather than Math.random (not random enough to be
 * unguessable) and rather than randomBytes % 1000000 (modulo bias makes some
 * codes measurably more likely).
 */
export function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(OTP_LENGTH, '0');
}

export function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

/**
 * Constant-time comparison of a submitted code against a stored hash.
 *
 * A plain `===` on the hashes leaks timing information: it returns faster
 * the earlier the first differing byte is, which over many attempts narrows
 * down the value. Irrelevant for most inputs, but this one guards account
 * ownership, so it gets the careful comparison.
 */
export function verifyOtpHash(code, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;

  const candidate = Buffer.from(hashOtp(code), 'hex');
  const stored = Buffer.from(storedHash, 'hex');

  // timingSafeEqual throws on a length mismatch, which would itself be a
  // (crude) signal, so the lengths are checked first.
  if (candidate.length !== stored.length) return false;

  return crypto.timingSafeEqual(candidate, stored);
}

/** Everything needed to persist a freshly issued code. */
export function issueOtp() {
  const code = generateOtp();
  return {
    code, // mailed to the customer, never stored
    otpHash: hashOtp(code),
    otpExpiry: new Date(Date.now() + OTP_TTL_MS),
    otpAttempts: 0,
    otpLastSentAt: new Date(),
  };
}

/**
 * Seconds a caller must wait before another code may be sent, or 0.
 *
 * The in-memory limiter in rateLimit.js can't be trusted alone on serverless
 * (instances don't share memory), so the durable timestamp on the user
 * document is the real check.
 */
export function resendCooldownRemaining(otpLastSentAt) {
  if (!otpLastSentAt) return 0;
  const elapsed = Date.now() - new Date(otpLastSentAt).getTime();
  if (elapsed >= OTP_RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
}

/** Normalise user input: strip spaces/dashes people paste in from an email. */
export function normaliseOtpInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
}
