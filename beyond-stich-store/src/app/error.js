'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './error.module.css';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Crash:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <motion.h1 
          className={styles.title} style={{ fontSize: '3rem' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          SOMETHING WENT WRONG
        </motion.h1>
        <motion.p className={styles.subtitle} style={{ marginBottom: 'var(--space-8)' }}>
          System failure detected.
        </motion.p>
        
        <div className={styles.actionRow}>
          <button onClick={() => reset()} className={styles.ctaBtn}>
            RETRY NOW
          </button>
          <Link href="/" className={styles.secondaryBtn}>
            RETURN HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
