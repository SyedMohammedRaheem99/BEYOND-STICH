'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '../login/page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
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
        <h1 className={styles.title}>FORGOT PASSWORD</h1>
        <p className={styles.subtitle}>
          {sent
            ? 'Check your email for a reset link.'
            : 'Enter your email and we\'ll send you a reset link.'}
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {sent && <div className={styles.success}>If an account exists with that email, a reset link has been sent.</div>}

        {!sent ? (
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

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
          </form>
        ) : (
          <Link href="/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            BACK TO SIGN IN
          </Link>
        )}

        <p className={styles.switchLink}>
          Remember your password? <Link href="/login">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
