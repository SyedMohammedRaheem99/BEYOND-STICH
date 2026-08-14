'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, useUIStore } from '@/lib/store';
import { SEGMENTS } from '@/lib/constants';
import useFocusTrap from '@/hooks/useFocusTrap';
import styles from './Navbar.module.css';

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [worldsOpen, setWorldsOpen] = useState(false);
  const { data: session } = useSession();
  const menuTrapRef = useFocusTrap(mobileMenuOpen);
  const { items, openCart } = useCartStore();
  const { setCursorVariant, resetCursor } = useUIStore();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    setSearchOpen(false);
    setSearchValue('');
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu / search overlay / worlds menu on Escape.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setMobileMenuOpen(false);
      setSearchOpen(false);
      setWorldsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
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
          {/* Left — Mobile toggle + Desktop nav */}
          <div className={styles.leftCluster}>
            <button
              className={styles.menuToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className={`${styles.hamburger} ${mobileMenuOpen ? styles.active : ''}`}>
                <span></span>
                <span></span>
              </span>
            </button>

            <nav className={styles.desktopNav} aria-label="Primary">
              <Link href="/shop" className={styles.navLink} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                SHOP
              </Link>

              <div
                className={styles.worldsWrap}
                onMouseEnter={() => setWorldsOpen(true)}
                onMouseLeave={() => setWorldsOpen(false)}
              >
                <button
                  className={styles.navLink}
                  aria-haspopup="true"
                  aria-expanded={worldsOpen}
                  onClick={() => setWorldsOpen((v) => !v)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  WORLDS
                  <span className={`${styles.chev} ${worldsOpen ? styles.chevOpen : ''}`} aria-hidden="true">▾</span>
                </button>

                <AnimatePresence>
                  {worldsOpen && (
                    <motion.div
                      className={styles.megaMenu}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      role="menu"
                    >
                      <div className={styles.megaGrid}>
                        {SEGMENTS.map((seg) => (
                          <Link
                            key={seg.id}
                            href={`/segment/${seg.id}`}
                            className={styles.megaItem}
                            onClick={() => setWorldsOpen(false)}
                            role="menuitem"
                          >
                            <span className={styles.megaDot} style={{ background: seg.accent }} />
                            <span className={styles.megaText}>
                              <span className={styles.megaName}>{seg.name}</span>
                              <span className={styles.megaTag}>{seg.tagline}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/about" className={styles.navLink} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                ABOUT
              </Link>
            </nav>
          </div>

          {/* Center — Logo */}
          <Link
            href="/"
            className={styles.logo}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <img 
              src="/logos/beyond-stich-logo.png"
              alt="Beyond Stich"
              className={styles.logoImage}
              width={312}
              height={312}
            />
          </Link>

          {/* Right — Actions */}
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={() => setSearchOpen(!searchOpen)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="search-overlay"
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
              href={session ? '/account' : '/login'}
              className={`${styles.actionBtn} ${styles.hideOnMobile}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label={session ? `Account — ${session.user?.name}` : 'Sign in'}
            >
              {session ? (
                <span className={styles.userInitial}>
                  {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </Link>

            <button
              className={styles.cartBtn}
              onClick={openCart}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label={`Open cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
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
                  aria-hidden="true"
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
            <motion.form
              className={styles.searchOverlay}
              id="search-overlay"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={submitSearch}
            >
              <input
                type="search"
                placeholder="Search drops..."
                className={styles.searchInput}
                aria-label="Search drops"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className={styles.searchClose}
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                ✕
              </button>
            </motion.form>
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
              ref={menuTrapRef}
              className={styles.sideMenu}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
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
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              <nav className={styles.sideMenuNav} aria-label="Segments">
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  ALL DROPS
                </Link>
                <Link href="/segment/gym" onClick={() => setMobileMenuOpen(false)}>
                  GYM
                </Link>
                <Link href="/segment/coffee" onClick={() => setMobileMenuOpen(false)}>
                  COFFEE
                </Link>
                <Link href="/segment/millionaire" onClick={() => setMobileMenuOpen(false)}>
                  MILLIONAIRE
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

              {/* The account icon is hidden on mobile, so without these there
                  is no path to order tracking or support on a phone — and
                  "where is my order" is the main query for a COD store. */}
              <nav className={styles.sideMenuSecondary} aria-label="Account and help">
                <Link href="/track" onClick={() => setMobileMenuOpen(false)}>
                  TRACK ORDER
                </Link>
                <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                  MY ACCOUNT
                </Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                  CONTACT
                </Link>
                <Link href="/returns" onClick={() => setMobileMenuOpen(false)}>
                  RETURNS
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
