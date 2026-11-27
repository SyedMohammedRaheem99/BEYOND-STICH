'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PasswordInput from '@/components/ui/PasswordInput';
import { trackSignUp } from '@/lib/analytics';
import { resolveAfterSignIn } from '@/lib/authRedirect';
import styles from '../login/page.module.css';

function RegisterForm() {
  const router = useRouter();
  // Registering from a "sign in" link mid-checkout used to land the customer
  // on /account instead of back where they were.
  const searchParams = useSearchParams();
  const callbackUrl = resolveAfterSignIn(searchParams.get('callbackUrl'));

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      trackSignUp('email');

      // Signing in straight away is no longer possible: the account starts
      // unverified, so the credentials provider would reject it. Send them
      // to enter the code instead, carrying callbackUrl through so finishing
      // verification still returns them to checkout rather than /account.
      const next = `/login?verified=1&callbackUrl=${encodeURIComponent(callbackUrl)}`;
      router.push(
        `/verify-email?email=${encodeURIComponent(data.email || form.email)}` +
          `&callbackUrl=${encodeURIComponent(next)}`
      );
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <motion.div
        className={styles.authCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className={styles.title}>JOIN THE WORLD</h1>
        <p className={styles.subtitle}>Create your Beyond Stich account.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="name">FULL NAME</label>
            <input
              id="name"
              type="text"
              className={styles.input}
              value={form.name}
              onChange={update('name')}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={form.email}
              onChange={update('email')}
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
              value={form.password}
              onChange={update('password')}
              placeholder="Min 8 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirmPassword">CONFIRM PASSWORD</label>
            <PasswordInput
              id="confirmPassword"
              
              className={styles.input}
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              placeholder="Re-enter password"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary.
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
