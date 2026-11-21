'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './AnnouncementBar.module.css';

// Only claims we can actually honour. This previously advertised WELCOME20,
// which did not exist in the database — customers reached checkout, typed it,
// and got "Invalid coupon code". It also announced a "new" Gamer collection
// and a Floral Women's Edit as fresh drops when neither had launched.
// Keep every line short enough to fit a 360px phone. The first-order offer
// used to be one 62-character line ("...10% off above ₹949 — 25% off above
// ₹1999") which needed ~480px and bled off both edges of the bar; it is now
// split across two slides that rotate like the rest.
const MESSAGES = [
  // ₹949 is the cheapest tee, so this is the real entry point — ₹799 was a
  // threshold no basket could actually sit below.
  '🎉 First order? Get 10% off above ₹949',
  '🎉 Get 25% off above ₹1999',
  '🚚 FREE shipping on every order',
  '📦 Cash on Delivery available across India',
  '🔁 7-day easy returns & exchanges',
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
