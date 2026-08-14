'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { PROMOS } from '@/lib/banners';
import styles from './OfferBanner.module.css';

const ICONS = {
  percent: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="7" cy="7" r="3" /><circle cx="17" cy="17" r="3" /><line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  ),
  truck: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  stack: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="12 2 2 7 12 12 22 7" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  ),
};

export default function OfferBanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className={styles.section} ref={ref}>
      <div className="container">
        <motion.p
          className={styles.sectionLabel}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          EXCLUSIVE OFFERS
        </motion.p>

        <div className={styles.grid}>
          {PROMOS.map((promo, i) => (
            <motion.div
              key={promo.id}
              className={styles.card}
              style={{ '--accent': promo.accent }}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Accent glow */}
              <div className={styles.cardGlow} />

              {/* Icon */}
              <div className={styles.iconWrap}>
                {ICONS[promo.icon]}
              </div>

              {/* Headlines */}
              <div className={styles.headlineGroup}>
                <h3 className={styles.headline}>{promo.headline}</h3>
                <p className={styles.subheadline}>{promo.subheadline}</p>
              </div>

              {/* Description */}
              <p className={styles.description}>{promo.description}</p>

              {/* Code (if exists) */}
              {promo.code && (
                <div className={styles.codeBox}>
                  <span className={styles.codeLabel}>USE CODE</span>
                  <span className={styles.code}>{promo.code}</span>
                </div>
              )}

              {/* CTA */}
              <Link href={promo.cta.href} className={styles.cta}>
                {promo.cta.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Bottom accent line */}
              <div className={styles.accentLine} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
