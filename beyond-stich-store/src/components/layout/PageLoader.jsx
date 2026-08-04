'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './PageLoader.module.css';

export default function PageLoader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show the branded intro at most ONCE per browser session, keep it short,
    // and skip it entirely for users who prefer reduced motion.
    const seen = sessionStorage.getItem('bs_intro_seen');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (seen || reduceMotion) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('bs_intro_seen', '1');
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={styles.loader}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <div className={styles.content}>
            <motion.div
              className={styles.logoWrap}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={styles.logoBeyond}>BEYOND</span>
              <motion.span
                className={styles.logoStich}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                STICH
              </motion.span>
            </motion.div>

            <motion.div
              className={styles.progressBar}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            />

            <motion.p
              className={styles.tagline}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              Wear the thought.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
