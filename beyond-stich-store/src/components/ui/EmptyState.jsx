'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './EmptyState.module.css';

/**
 * Consistent, on-brand empty state used across the store (wishlist, search,
 * cart, etc.). Pass an `icon` (SVG element), a title, message, and an optional
 * primary action.
 */
export default function EmptyState({ icon, title, message, actionLabel, actionHref }) {
  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {icon && <div className={styles.icon} aria-hidden="true">{icon}</div>}
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.message}>{message}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={styles.action}>
          {actionLabel}
        </Link>
      )}
    </motion.div>
  );
}
