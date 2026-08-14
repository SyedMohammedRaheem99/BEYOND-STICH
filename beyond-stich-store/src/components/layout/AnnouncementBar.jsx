'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './AnnouncementBar.module.css';

const MESSAGES = [
  'FREE shipping on all orders over ₹999',
  'Cash on Delivery available across India',
  '7-day easy returns & exchanges',
  'New drop live — limited stock',
];

export default function AnnouncementBar() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <span className={styles.static}>★</span>
      <div className={styles.track}>
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            className={styles.msg}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {MESSAGES[i]}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className={styles.static}>★</span>
    </div>
  );
}
