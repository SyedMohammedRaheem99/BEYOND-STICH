'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SHOP_BANNERS } from '@/lib/banners';
import styles from './ShopBanner.module.css';

// Art for each promo slide, keyed by banner id. Each image is chosen to show
// what its headline claims, rather than just being on-brand wallpaper:
//
//  · the first-order offer shows the RANGE (six designs across gamer, floral
//    and typography) — it previously used an empty showroom with no garment
//    in it at all, which is a poor argument for "save 25% on your first order";
//  · the price slide shows the GARMENT close up, where the drop-shoulder cut
//    and the 240 GSM weight are actually legible;
//  · the shipping slide shows the BOX — branded mailer, tissue and hangtag.
//
// Mobile crops are separate files, not the desktop image squeezed: at a phone's
// aspect ratio the desktop frames crop to a wall or a sleeve.
const IMAGES = {
  'new-this-week': {
    desktop: '/banners/hero/home-2-desktop.webp',
    mobile: '/banners/hero/home-2-mobile.webp',
  },
  'starting-price': {
    desktop: '/banners/shop/drops-2-desktop.webp',
    mobile: '/banners/shop/drops-2-mobile.webp',
  },
  'free-shipping': {
    desktop: '/banners/shop/drops-3-desktop.webp',
    mobile: '/banners/shop/drops-3-mobile.webp',
  },
};

// 6s rather than 4.5s — same reasoning as the home hero, slightly
// quicker since these slides carry less copy.
const AUTOPLAY_INTERVAL = 6000;

export default function ShopBanner() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const touchStartRef = useRef(0);
  const total = SHOP_BANNERS.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
  }, [next]);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
      resetTimer();
    }
  };

  const banner = SHOP_BANNERS[current];
  const bgImage = IMAGES[banner.id];

  return (
    <div
      className={styles.wrapper}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          className={styles.slide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background image */}
          <div className={styles.bgWrap}>
            {/* <picture> rather than a bare <img>: the browser picks the
                mobile crop and never downloads the desktop file on a phone.
                The first slide is the page's LCP element, so it loads eagerly
                with high priority — `loading="lazy"` on it delayed the largest
                paint until after hydration. */}
            {/* eslint-disable-next-line @next/next/no-img-element --
                banner art is chosen at runtime from CMS-ish config; the
                height is fixed in CSS so there is no layout shift. */}
            <picture>
              <source media="(max-width: 768px)" srcSet={bgImage.mobile} />
              <img
                src={bgImage.desktop}
                alt={banner.headline}
                className={styles.bgImg}
                loading={current === 0 ? 'eager' : 'lazy'}
                fetchPriority={current === 0 ? 'high' : 'auto'}
              />
            </picture>
            <div
              className={styles.bgOverlay}
              style={{ '--accent': banner.accent }}
            />
          </div>

          {/* Content */}
          <div className={styles.content}>
            <div className={styles.textGroup}>
              {/* Accent rule + label, matching the home hero's eyebrow. It
                  anchors the headline to the brand colour and gives the copy
                  stack a top edge instead of starting cold on the image. */}
              <motion.span
                className={styles.eyebrow}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.5 }}
              >
                All Drops
              </motion.span>
              <motion.h2
                className={styles.headline}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                {banner.headline}
              </motion.h2>
              <motion.p
                className={styles.sub}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                {banner.subheadline}
              </motion.p>
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <Link
                href={banner.cta.href}
                className={styles.cta}
                style={{ '--accent': banner.accent }}
              >
                {banner.cta.label}
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => { prev(); resetTimer(); }}
        aria-label="Previous banner"
      >
        ‹
      </button>
      <button
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => { next(); resetTimer(); }}
        aria-label="Next banner"
      >
        ›
      </button>

      {/* Dots */}
      <div className={styles.dots}>
        {SHOP_BANNERS.map((b, i) => (
          <button
            key={b.id}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => { setCurrent(i); resetTimer(); }}
            aria-label={`Go to banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
