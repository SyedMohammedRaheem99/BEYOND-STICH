'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MagneticButton from '@/components/ui/MagneticButton';
import { HERO } from '@/lib/banners';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const letters1 = 'BEYOND'.split('');
  const letters2 = 'STICH'.split('');

  return (
    <section className={`${styles.hero} noise-overlay`}>
      {/* Cinematic backdrop */}
      <motion.div
        className={styles.bg}
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <picture>
          <source media="(max-width:768px)" srcSet={HERO.mobile} />
          <img src={HERO.desktop} alt="Hero background" className={styles.heroImg} loading="eager" fetchPriority="high" />
        </picture>
      </motion.div>
      <div className={styles.bgOverlay} />

      {/* Ambient light effects */}
      <div className={styles.ambientLight} />
      <div className={styles.ambientLight2} />

      <div className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.line}>
            {letters1.map((letter, i) => (
              <motion.span
                key={i}
                className={styles.letter}
                initial={{ y: 120, opacity: 0, rotateX: -90 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.15 + i * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </span>
          <span className={styles.line}>
            {letters2.map((letter, i) => (
              <motion.span
                key={i}
                className={`${styles.letter} ${styles.letterMuted}`}
                initial={{ y: 120, opacity: 0, rotateX: -90 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.35 + i * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p
          className={styles.tagline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {HERO.headline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        >
          <MagneticButton href={HERO.cta.href} variant="primary">
            {HERO.cta.label}
          </MagneticButton>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className={styles.scrollLine}>
          <motion.div
            className={styles.scrollDot}
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
}
