'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { HERO_SLIDES } from '@/lib/banners';
import styles from './HeroSection.module.css';

const AUTOPLAY_INTERVAL = 5000;

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);
  const touchStartRef = useRef(0);

  const total = HERO_SLIDES.length;

  const goTo = useCallback((index, dir) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % total, 1);
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total, -1);
  }, [current, total, goTo]);

  // Autoplay
  useEffect(() => {
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next]);

  // Reset timer on manual interaction
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
  }, [next]);

  const handleDotClick = (index) => {
    goTo(index, index > current ? 1 : -1);
    resetTimer();
  };

  // Swipe support
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

  const slide = HERO_SLIDES[current];

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (delay) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <section
      className={styles.hero}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background slides */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={slide.id}
          className={styles.bg}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <picture>
            <source media="(max-width: 768px)" srcSet={slide.mobile} />
            <img
              src={slide.desktop}
              alt={slide.headline.replace(/\n/g, ' ')}
              className={styles.heroImg}
              loading={current === 0 ? 'eager' : 'lazy'}
              fetchPriority={current === 0 ? 'high' : 'auto'}
            />
          </picture>
          <div className={styles.bgOverlay} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id + '-content'}
          className={styles.content}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Badge */}
          <motion.span
            className={styles.badge}
            custom={0.1}
            variants={contentVariants}
          >
            {slide.badge}
          </motion.span>

          {/* Headline */}
          <motion.p
            className={styles.title}
            custom={0.2}
            variants={contentVariants}
          >
            {slide.headline.split('\n').map((line, i) => (
              <span key={i} className={styles.line}>
                {line}
              </span>
            ))}
          </motion.p>

          {/* Subheadline */}
          <motion.p
            className={styles.tagline}
            custom={0.35}
            variants={contentVariants}
          >
            {slide.subheadline}
          </motion.p>

          {/* Code (if exists) */}
          {slide.code && (
            <motion.div
              className={styles.codeBox}
              custom={0.45}
              variants={contentVariants}
            >
              <span className={styles.codeLabel}>USE CODE</span>
              <span className={styles.code}>{slide.code}</span>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div custom={0.5} variants={contentVariants}>
            <Link href={slide.cta.href} className={styles.cta}>
              {slide.cta.label}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => { prev(); resetTimer(); }}
        aria-label="Previous slide"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => { next(); resetTimer(); }}
        aria-label="Next slide"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className={styles.dots}>
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Go to slide ${i + 1}`}
          >
            {i === current && (
              <motion.span
                className={styles.dotProgress}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTOPLAY_INTERVAL / 1000, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollLine}>
          <motion.div
            className={styles.scrollDot}
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </section>
  );
}
