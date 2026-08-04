'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { OFFER } from '@/lib/banners';
import styles from './OfferBanner.module.css';

export default function OfferBanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className={styles.section} ref={ref}>
      <motion.div
        className={`${styles.banner} container noise-overlay`}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <picture className={styles.bg}>
          <source media="(max-width:768px)" srcSet={OFFER.mobile} />
          <img src={OFFER.desktop} alt="Offer background" className={styles.bgImg} loading="lazy" />
        </picture>
        <div className={styles.content}>
          <span className={styles.eyebrow}>{OFFER.eyebrow}</span>
          <h2 className={styles.headline}>
            {OFFER.headline.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </h2>
          <div className={styles.actionRow}>
            <div className={styles.codeBox}>
              <span className={styles.codeLabel}>USE CODE</span>
              <span className={styles.code}>{OFFER.code}</span>
            </div>
            <Link href={OFFER.cta.href} className={styles.cta}>
              {OFFER.cta.label} →
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
