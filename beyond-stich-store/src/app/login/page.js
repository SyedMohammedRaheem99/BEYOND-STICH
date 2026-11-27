'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PasswordInput from '@/components/ui/PasswordInput';
import { trackLogin } from '@/lib/analytics';
import { resolveAfterSignIn } from '@/lib/authRedirect';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Back to wherever they were, not the dashboard. resolveAfterSignIn also
  // rejects off-site and auth-page targets, so a crafted ?callbackUrl= cannot
  // bounce someone elsewhere the moment they authenticate.
  const callbackUrl = resolveAfterSignIn(searchParams.get('callbackUrl'));
  const registered = searchParams.get('registered');
  // Set by /verify-email once the code is accepted.
  const justVerified = searchParams.get('verified');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google sign-in is only offered when the server actually has the
  // credentials for it. lib/auth.js registers that provider conditionally,
  // so without them signIn('google') hit a provider that did not exist and
  // the button did nothing — no navigation, no error, nothing.
  //
  // Starts false so the button never flashes in and out on a page where it
  // will not be available. Adding GOOGLE_CLIENT_ID/SECRET to the environment
  // brings it back with no code change.
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/providers-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.google) setGoogleEnabled(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // An unverified account is a different problem from a wrong
        // password, and needs a different next step — telling them
        // "invalid credentials" would send them to reset a password that
        // was never wrong.
        if (result.error.includes('EMAIL_NOT_VERIFIED')) {
          router.push(
            `/verify-email?email=${encodeURIComponent(email)}` +
              `&callbackUrl=${encodeURIComponent(`/login?verified=1&callbackUrl=${encodeURIComponent(callbackUrl)}`)}`
          );
          return;
        }
        setError('Invalid email or password');
      } else {
        trackLogin('email');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className={styles.authPage}>
      <motion.div
        className={styles.authCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className={styles.title}>SIGN IN</h1>
        <p className={styles.subtitle}>Welcome back to Beyond Stich.</p>

        {justVerified ? (
          <div className={styles.success} role="status">
            Email verified. Sign in to continue.
          </div>
        ) : registered ? (
          <div className={styles.success}>Account created! Sign in below.</div>
        ) : null}

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">PASSWORD</label>
            <PasswordInput
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--color-text-muted)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        {/* Hidden until the server reports Google credentials are present —
            see the googleEnabled effect above. The markup stays here rather
            than being deleted so enabling it is purely an env-var change. */}
        {googleEnabled && (
          <>
            <div className={styles.divider}>OR</div>

            <button type="button" className={styles.googleBtn} onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              CONTINUE WITH GOOGLE
            </button>
          </>
        )}

        <p className={styles.switchLink}>
          {/* Carry callbackUrl across so cart → checkout → sign in → create
              account returns to checkout rather than /account. */}
          Don&apos;t have an account?{' '}
          <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
