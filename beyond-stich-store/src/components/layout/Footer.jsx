'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BRAND, SEGMENTS } from '@/lib/constants';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');
  const [subLoading, setSubLoading] = useState(false);


  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubError('');
    // Tell the user why nothing happened — a bare return left the button
    // looking broken.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubError('Enter a valid email address');
      return;
    }
    if (subLoading) return;
    setSubLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail('');
      } else {
        const data = await res.json();
        setSubError(data.error || 'Something went wrong');
      }
    } catch {
      setSubError('Network error. Try again.');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <footer className={`${styles.footer} noise-overlay`}>
      {/* Newsletter Strip */}
      <div className={styles.newsletter}>
        <div className={`${styles.newsletterInner} container`}>
          <h2 className={styles.newsletterTitle}>
            GET DROPS BEFORE EVERYONE ELSE
          </h2>
          {subscribed ? (
            <p className={styles.newsletterSuccess} role="status">
              You&apos;re on the list. Watch your inbox for the next drop. ✓
            </p>
          ) : (
            <>
              <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  className={styles.newsletterInput}
                  aria-label="Email address for drop notifications"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className={styles.newsletterBtn}
                  disabled={subLoading}
                >
                  {subLoading ? 'SIGNING UP…' : 'NOTIFY ME'}
                </button>
              </form>
              {subError && <p style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '8px' }}>{subError}</p>}
            </>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className={`${styles.main} container`}>
        {/* Brand Column */}
        <div className={styles.brandCol}>
          <div className={styles.brandLogo}>
          {/* eslint-disable-next-line @next/next/no-img-element --
              same hand-tuned wordmark srcSet as the navbar. */}
            <img
              src="/logos/wordmark.png"
              srcSet="/logos/wordmark.png 1x, /logos/wordmark@2x.png 2x, /logos/wordmark@3x.png 3x"
              alt="Beyond Stich"
              className={styles.footerLogoImage}
              width={296}
              height={84}
              loading="lazy"
            />
          </div>
          <p className={styles.brandTagline}>{BRAND.tagline}</p>
          <div className={styles.socials}>
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
          <p className={styles.businessInfo}>
            Beyond Stich — Bangalore, India
          </p>
        </div>

        {/* Segments Column */}
        <div className={styles.linksCol}>
          <h3 className={styles.colTitle}>SEGMENTS</h3>
          <nav className={styles.linksList}>
            {SEGMENTS.slice(0, 7).map((seg) => (
              <Link
                key={seg.id}
                href={`/segment/${seg.id}`}
              >
                {seg.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.linksCol}>
          <h3 className={styles.colTitle}>MORE</h3>
          <nav className={styles.linksList}>
            {SEGMENTS.slice(7).map((seg) => (
              <Link
                key={seg.id}
                href={`/segment/${seg.id}`}
              >
                {seg.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Help Column */}
        <div className={styles.linksCol}>
          <h3 className={styles.colTitle}>HELP</h3>
          <nav className={styles.linksList}>
            <Link href="/track">Track Order</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/size-guide">Size Guide</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/stores/bangalore">Beyond Stich Bangalore</Link>
          </nav>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottom}>
        <div className={`${styles.bottomInner} container`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Beyond Stich. All rights reserved.
          </p>
          <div className={styles.legal}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
