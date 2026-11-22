'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { HERO_SLIDES } from '@/lib/banners';
import styles from './HeroSection.module.css';

// 6.75s rather than 5s: a shopper scrolling past needs long enough to
// read the headline and register the offer before the slide moves. The
// progress bar below is driven off this same value, so the two stay in
// step.
const AUTOPLAY_INTERVAL = 6750;

const ArrowIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const touchStartRef = useRef(0);
  const reduceMotion = useReducedMotion();

  const total = HERO_SLIDES.length;

  const goTo = useCallback((index, dir) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  // Autoplay. Pauses on hover/focus so a keyboard user isn't fighting the
  // carousel mid-read, and stops entirely under reduced motion — auto-
  // advancing content is exactly what that setting is asking us not to do.
  useEffect(() => {
    if (paused || reduceMotion) return;
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next, paused, reduceMotion]);

  const handleDotClick = (index) => {
    goTo(index, index > current ? 1 : -1);
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const slide = HERO_SLIDES[current];

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <section
      className={styles.hero}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured offers"
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
          {/* Real art direction: the mobile files are portrait crops framed
              for a phone, not the landscape image squeezed down. next/image
              can't switch source by breakpoint, so the two are stacked and
              CSS shows one — both are lazy except the first slide, so the
              hidden one isn't fetched. */}
          <Image
            src={slide.desktop}
            alt={slide.headline.replace(/\n/g, ' ')}
            fill
            sizes="100vw"
            className={`${styles.heroImg} ${styles.heroImgDesktop}`}
            loading={current === 0 ? 'eager' : 'lazy'}
            fetchPriority={current === 0 ? 'high' : 'auto'}
          />
          <Image
            src={slide.mobile}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className={`${styles.heroImg} ${styles.heroImgMobile}`}
            loading={current === 0 ? 'eager' : 'lazy'}
            fetchPriority={current === 0 ? 'high' : 'auto'}
          />
          <div
            className={`${styles.bgOverlay} ${
              slide.theme === 'light' ? styles.bgOverlayLight : ''
            }`}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content. aria-live announces slide changes to screen readers, which
          otherwise get a silently mutating region. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id + '-content'}
          className={styles.content}
          initial="hidden"
          animate="visible"
          exit="hidden"
          aria-live="polite"
          aria-atomic="true"
        >
          <motion.span className={styles.eyebrow} custom={0.05} variants={contentVariants}>
            {slide.badge}
          </motion.span>

          <motion.p className={styles.title} custom={0.12} variants={contentVariants}>
            {slide.headline.split('\n').map((line, i) => (
              <span key={i} className={styles.line}>
                {line}
              </span>
            ))}
          </motion.p>

          <motion.p className={styles.tagline} custom={0.2} variants={contentVariants}>
            {slide.subheadline}
          </motion.p>

          <motion.div className={styles.actions} custom={0.28} variants={contentVariants}>
            <Button href={slide.cta.href} variant="primary" size="lg" icon={<ArrowIcon />}>
              {slide.cta.label}
            </Button>
          </motion.div>

          {slide.code && (
            <motion.p className={styles.codeRow} custom={0.34} variants={contentVariants}>
              <span className={styles.codeLabel}>Use code</span>
              <span className={styles.code}>{slide.code}</span>
            </motion.p>
          )}

          {/* Controls live inside the content column so they align to the
              same grid as the copy, instead of floating at the viewport edges. */}
          <div className={styles.controls}>
            <div className={styles.arrows}>
              <button className={styles.arrow} onClick={prev} aria-label="Previous slide">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button className={styles.arrow} onClick={next} aria-label="Next slide">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <div className={styles.dots}>
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                  onClick={() => handleDotClick(i)}
                  aria-label={`Go to slide ${i + 1} of ${total}`}
                  aria-current={i === current ? 'true' : undefined}
                >
                  {i === current && !reduceMotion && !paused && (
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
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
