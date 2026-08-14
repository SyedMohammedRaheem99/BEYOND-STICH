'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BRAND, SEGMENTS } from '@/lib/constants';
import { useUIStore } from '@/lib/store';
import styles from './Footer.module.css';

export default function Footer() {
  const { setCursorVariant, resetCursor } = useUIStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');

  const handleMouseEnter = () => setCursorVariant('hover');
  const handleMouseLeave = () => resetCursor();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
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
    }
  };

  return (
    <footer className={`${styles.footer} noise-overlay`}>
      {/* Newsletter Strip */}
      <div className={styles.newsletter}>
        <div className={`${styles.newsletterInner} container`}>
          <h3 className={styles.newsletterTitle}>
            GET DROPS BEFORE EVERYONE ELSE
          </h3>
          {subscribed ? (
            <p className={styles.newsletterSuccess} role="status">
              You're on the list. Watch your inbox for the next drop. ✓
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
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  NOTIFY ME
                </button>
              </form>
              {subError && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '8px' }}>{subError}</p>}
            </>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className={`${styles.main} container`}>
        {/* Brand Column */}
        <div className={styles.brandCol}>
          <div className={styles.brandLogo}>
            <img 
              src="/logos/beyond-stich-logo.png" 
              alt="Beyond Stich" 
              className={styles.footerLogoImage} 
            />
          </div>
          <p className={styles.brandTagline}>{BRAND.tagline}</p>
          <div className={styles.socials}>
            <a href="https://instagram.com/beyondstich" target="_blank" rel="noopener noreferrer" aria-label="Instagram" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
          <h4 className={styles.colTitle}>SEGMENTS</h4>
          <nav className={styles.linksList}>
            {SEGMENTS.slice(0, 7).map((seg) => (
              <Link
                key={seg.id}
                href={`/segment/${seg.id}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {seg.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.linksCol}>
          <h4 className={styles.colTitle}>MORE</h4>
          <nav className={styles.linksList}>
            {SEGMENTS.slice(7).map((seg) => (
              <Link
                key={seg.id}
                href={`/segment/${seg.id}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {seg.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Help Column */}
        <div className={styles.linksCol}>
          <h4 className={styles.colTitle}>HELP</h4>
          <nav className={styles.linksList}>
            <Link href="/track" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Track Order</Link>
            <Link href="/contact" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Contact Us</Link>
            <Link href="/shipping" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Shipping</Link>
            <Link href="/returns" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Returns</Link>
            <Link href="/size-guide" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Size Guide</Link>
            <Link href="/faq" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>FAQ</Link>
            <Link href="/stores/bangalore" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>Beyond Stich Bangalore</Link>
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
