'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SEGMENTS } from '@/lib/constants';
import styles from './SocialProofBar.module.css';

export default function SocialProofBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  // Honest, verifiable product facts — no fabricated sales/rating numbers.
  const metrics = [
    { value: '240', label: 'GSM HEAVYWEIGHT' },
    { value: String(SEGMENTS.length), label: 'SEGMENT WORLDS' },
    { value: '100%', label: 'COMBED COTTON' },
    { value: '2', label: 'OVERSIZED FITS' },
  ];

  return (
    <section className={styles.section} ref={ref}>
      <div className={`${styles.container} container`}>
        <div className={styles.grid}>
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              className={styles.item}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span className={styles.value}>{metric.value}</span>
              <span className={styles.label}>{metric.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
