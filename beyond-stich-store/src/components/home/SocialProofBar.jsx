'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './SocialProofBar.module.css';

export default function SocialProofBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const metrics = [
    { value: '10K+', label: 'TEES DROPPED' },
    { value: '4.9★', label: 'AVERAGE RATING' },
    { value: '13', label: 'SEGMENT WORLDS' },
    { value: '24/7', label: 'THE HUSTLE' },
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
