'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, useUIStore } from '@/lib/store';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { items, openCart } = useCartStore();
  const { setCursorVariant, resetCursor } = useUIStore();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = () => setCursorVariant('hover');
  const handleMouseLeave = () => resetCursor();

  return (
    <>
      <motion.nav
        className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.navInner}>
          {/* Left — Menu Toggle */}
          <button
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label="Menu"
          >
            <span className={`${styles.hamburger} ${mobileMenuOpen ? styles.active : ''}`}>
              <span></span>
              <span></span>
            </span>
          </button>

          {/* Center — Logo */}
          <Link
            href="/"
            className={styles.logo}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <span className={styles.logoText}>BEYOND</span>
            <span className={styles.logoAccent}>STICH</span>
          </Link>

          {/* Right — Actions */}
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={() => setSearchOpen(!searchOpen)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <Link
              href="/account/wishlist"
              className={styles.actionBtn}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label="Wishlist"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </Link>

            <Link
              href="/account"
              className={`${styles.actionBtn} ${styles.hideOnMobile}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label="Account"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <button
              className={styles.cartBtn}
              onClick={openCart}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label="Cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {itemCount > 0 && (
                <motion.span
                  className={styles.cartBadge}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={itemCount}
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className={styles.searchOverlay}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <input
                type="text"
                placeholder="Search drops..."
                className={styles.searchInput}
                autoFocus
              />
              <button
                className={styles.searchClose}
                onClick={() => setSearchOpen(false)}
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Side Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className={styles.sideMenu}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className={styles.sideMenuHeader}>
                <span className={styles.sideMenuTitle}>EXPLORE</span>
                <button
                  className={styles.sideMenuClose}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ✕
                </button>
              </div>
              <nav className={styles.sideMenuNav}>
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  ALL DROPS
                </Link>
                <Link href="/segment/gym" onClick={() => setMobileMenuOpen(false)}>
                  GYM
                </Link>
                <Link href="/segment/coffee" onClick={() => setMobileMenuOpen(false)}>
                  COFFEE
                </Link>
                <Link href="/segment/milliniore" onClick={() => setMobileMenuOpen(false)}>
                  MILLINIORE
                </Link>
                <Link href="/segment/music" onClick={() => setMobileMenuOpen(false)}>
                  MUSIC
                </Link>
                <Link href="/segment/gamer" onClick={() => setMobileMenuOpen(false)}>
                  GAMER
                </Link>
                <Link href="/segment/cars" onClick={() => setMobileMenuOpen(false)}>
                  CARS
                </Link>
                <Link href="/segment/bike" onClick={() => setMobileMenuOpen(false)}>
                  BIKE
                </Link>
                <Link href="/segment/sports" onClick={() => setMobileMenuOpen(false)}>
                  SPORTS
                </Link>
                <Link href="/segment/summer" onClick={() => setMobileMenuOpen(false)}>
                  SUMMER
                </Link>
                <Link href="/segment/floral" onClick={() => setMobileMenuOpen(false)}>
                  FLORAL
                </Link>
                <Link href="/segment/typography" onClick={() => setMobileMenuOpen(false)}>
                  TYPOGRAPHY
                </Link>
                <Link href="/segment/valentine" onClick={() => setMobileMenuOpen(false)}>
                  VALENTINE
                </Link>
                <Link href="/segment/randoms" onClick={() => setMobileMenuOpen(false)}>
                  RANDOMS
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
