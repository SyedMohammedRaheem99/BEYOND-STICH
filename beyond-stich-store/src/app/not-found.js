'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './error.module.css'; // We'll create this or use global nav padding

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <motion.h1 
          className={styles.title}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          404
        </motion.h1>
        <motion.p 
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          THIS DROP DOESN'T EXIST
        </motion.p>
        <motion.p 
          className={styles.desc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          The page you are looking for has either moved to a different world or has been completely sold out and removed.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/shop" className={styles.cta}>
            BACK TO ALL DROPS
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
