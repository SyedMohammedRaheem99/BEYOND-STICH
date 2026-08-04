'use client';

import { motion } from 'framer-motion';
import styles from './InfoPageLayout.module.css';

/**
 * Shared premium wrapper for static content pages (About, FAQ, policies…).
 * Pass plain semantic children (h2/h3/p/ul) — they are styled automatically.
 */
export default function InfoPageLayout({ eyebrow = 'BEYOND STICH', title, intro, children }) {
  return (
    <div className={styles.page}>
      <header className={`${styles.hero} noise-overlay`}>
        <div className="container">
          <p className={styles.eyebrow}>{eyebrow}</p>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>
          {intro && <p className={styles.intro}>{intro}</p>}
        </div>
      </header>

      <div className={`${styles.body} container`}>{children}</div>
    </div>
  );
}
