'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './TrustBar.module.css';

const ITEMS = [
  {
    title: 'Secure Payments',
    sub: 'UPI, Cards, Netbanking',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Cash on Delivery',
    sub: 'Available across India',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  },
  {
    title: '7-Day Returns',
    sub: 'Easy & hassle-free',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
  },
  {
    title: '240 GSM Premium',
    sub: 'Heavyweight cotton',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
];

export default function TrustBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className={styles.section} ref={ref}>
      <div className={`${styles.grid} container`}>
        {ITEMS.map((item, i) => (
          <motion.div
            key={item.title}
            className={styles.item}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.text}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.sub}>{item.sub}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
