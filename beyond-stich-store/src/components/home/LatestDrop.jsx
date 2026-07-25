'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useUIStore } from '@/lib/store';
import styles from './LatestDrop.module.css';

// Placeholder data since DB is not populated yet
const LATEST_DROPS = [
  {
    id: 1,
    name: 'MIND OVER MATTER',
    segment: 'GYM',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
    color: '#F5C518',
  },
  {
    id: 2,
    name: 'SILENT MOVES',
    segment: 'MILLINIORE',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    color: '#D4AF37',
  },
  {
    id: 3,
    name: 'NIGHT RIDER',
    segment: 'BIKE',
    image: 'https://images.unsplash.com/photo-1572495532056-3245c38ebbe4?w=800&q=80',
    color: '#FF6B35',
  },
  {
    id: 4,
    name: 'CAFFEINE DRIVEN',
    segment: 'COFFEE',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
    color: '#C4622D',
  },
];

export default function LatestDrop() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { setCursorVariant, setCursorText, resetCursor } = useUIStore();

  const handleMouseEnter = () => {
    setCursorVariant('text');
    setCursorText('VIEW');
  };

  const handleMouseLeave = () => {
    resetCursor();
  };

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.header}>
        <motion.h2
          className={styles.title}
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          LATEST DROP
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/shop" className={styles.viewAll}>
            VIEW ALL →
          </Link>
        </motion.div>
      </div>

      <div className={styles.scrollContainer}>
        <div className={styles.track}>
          {LATEST_DROPS.map((item, index) => (
            <motion.div
              key={item.id}
              className={styles.item}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={`/product/latest-drop-${item.id}`}
                className={styles.card}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className={styles.imageWrap}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    style={{ objectFit: 'cover' }}
                    className={styles.image}
                  />
                  <div
                    className={styles.overlay}
                    style={{ '--hover-color': item.color }}
                  />
                </div>
                <div className={styles.info}>
                  <span className={styles.segment} style={{ color: item.color }}>
                    {item.segment}
                  </span>
                  <h3 className={styles.name}>{item.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
