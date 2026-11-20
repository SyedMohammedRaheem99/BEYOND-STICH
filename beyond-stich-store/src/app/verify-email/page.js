'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '../login/page.module.css';
import verifyStyles from './page.module.css';

const CODE_LENGTH = 6;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const callbackUrl = searchParams.get('callbackUrl') || '/login?verified=1';

  const [digits, setDigits] = useState(() => Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputsRef = useRef([]);
  // Guards against the auto-submit effect firing twice for one filled code
  // (React re-runs effects, and a double POST burns an attempt).
  const submittingRef = useRef(false);

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submitCode = useCallback(
    async (code) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setLoading(true);
      setError('');
      setNotice('');

      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code }),
        });
        const data = await res.json();

        if (res.ok && data.verified) {
          setNotice('Email verified. Redirecting…');
          router.push(callbackUrl);
          return;
        }

        setError(data.error || 'That code is not valid.');
        // A dead code needs a new one, so clear the boxes rather than
        // leaving the customer to delete six digits by hand.
        if (data.needsResend) {
          setDigits(Array(CODE_LENGTH).fill(''));
          inputsRef.current[0]?.focus();
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
        submittingRef.current = false;
      }
    },
    [email, callbackUrl, router]
  );

  const handleChange = (index, value) => {
    const chars = value.replace(/\D/g, '');
    if (!chars) {
      setDigits((d) => {
        const next = [...d];
        next[index] = '';
        return next;
      });
      return;
    }

    // Handles both a single keystroke and a pasted/autofilled full code.
    const next = [...digits];
    for (let i = 0; i < chars.length && index + i < CODE_LENGTH; i += 1) {
      next[index + i] = chars[i];
    }
    setDigits(next);

    const landed = Math.min(index + chars.length, CODE_LENGTH - 1);
    inputsRef.current[landed]?.focus();

    // Submit as soon as the last box is filled — on mobile this saves
    // hunting for a button hidden below the keyboard. Done here rather than
    // in an effect watching `digits`, which would re-fire on every render
    // that touched state and burn a verification attempt each time.
    if (!next.includes('')) submitCode(next.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Step back into the previous box so repeated backspace clears the
      // code, which is what every OTP field does.
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setNotice('A new code is on its way.');
        setDigits(Array(CODE_LENGTH).fill(''));
        inputsRef.current[0]?.focus();
        setCooldown(60);
      } else {
        setError(data.error || 'Could not send a new code.');
        if (data.retryAfter) setCooldown(data.retryAfter);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Reaching this page without an email means the signup flow was skipped;
  // there is nothing to verify against.
  if (!email) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>VERIFY EMAIL</h1>
          <p className={styles.subtitle}>
            We don&apos;t know which account to verify. Please sign in to continue.
          </p>
          <Link href="/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            GO TO SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <motion.div
        className={styles.authCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className={styles.title}>CHECK YOUR EMAIL</h1>
        <p className={styles.subtitle}>
          We sent a {CODE_LENGTH}-digit code to <strong>{email}</strong>.
        </p>

        {error && <div className={styles.error} role="alert">{error}</div>}
        {notice && <div className={styles.success} role="status">{notice}</div>}

        <div
          className={verifyStyles.codeRow}
          role="group"
          aria-label={`${CODE_LENGTH}-digit verification code`}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              className={verifyStyles.codeBox}
              type="text"
              inputMode="numeric"
              // Lets iOS and Android offer the code straight from the SMS/
              // email notification instead of making them switch apps.
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              // maxLength 1 would silently drop a pasted 6-digit code.
              maxLength={CODE_LENGTH}
              value={digit}
              disabled={loading}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${i + 1}`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.submitBtn}
          disabled={loading || digits.includes('')}
          onClick={() => submitCode(digits.join(''))}
        >
          {loading ? 'VERIFYING…' : 'VERIFY EMAIL'}
        </button>

        <p className={verifyStyles.resendRow}>
          Didn&apos;t get it?{' '}
          <button
            type="button"
            className={verifyStyles.resendBtn}
            onClick={handleResend}
            disabled={resending || cooldown > 0}
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resending
                ? 'Sending…'
                : 'Resend code'}
          </button>
        </p>

        <p className={verifyStyles.hint}>
          Check your spam folder too — and make sure the address above is
          spelled correctly.
        </p>

        <p className={styles.switchLink}>
          <Link href="/login">Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
