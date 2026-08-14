'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SHOP_BANNERS } from '@/lib/banners';
import styles from './ShopBanner.module.css';

const IMAGES = {
  'new-this-week': '/banners/shop/new-this-week.png',
  'starting-price': '/banners/shop/starting-price.png',
  'free-shipping': '/banners/shop/free-shipping.png',
};

const AUTOPLAY_INTERVAL = 4500;

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
            <img
              src={bgImage}
              alt={banner.headline}
              className={styles.bgImg}
              loading="lazy"
            />
            <div
              className={styles.bgOverlay}
              style={{ '--accent': banner.accent }}
            />
          </div>

          {/* Content */}
          <div className={styles.content}>
            <div className={styles.textGroup}>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
