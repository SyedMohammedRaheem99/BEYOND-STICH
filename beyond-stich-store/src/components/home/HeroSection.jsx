'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MagneticButton from '@/components/ui/MagneticButton';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const letters1 = 'BEYOND'.split('');
  const letters2 = 'STICH'.split('');

  return (
    <section className={`${styles.hero} noise-overlay`}>
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
                  duration: 1,
                  delay: 2.4 + i * 0.06,
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
                  duration: 1,
                  delay: 2.7 + i * 0.06,
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
          transition={{ delay: 3.2, duration: 0.8 }}
        >
          Wear the thought.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5, duration: 0.8 }}
        >
          <MagneticButton href="/shop" variant="primary">
            SHOP THE DROP
          </MagneticButton>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4, duration: 1 }}
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
