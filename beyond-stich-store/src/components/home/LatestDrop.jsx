'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useUIStore } from '@/lib/store';
import { getSegmentAccent } from '@/lib/constants';
import styles from './LatestDrop.module.css';

export default function LatestDrop({ initialDrops = [] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { setCursorVariant, setCursorText, resetCursor } = useUIStore();
  const [drops, setDrops] = useState(initialDrops);

  useEffect(() => {
    if (initialDrops.length > 0) return;
    fetch('/api/products?sort=newest&limit=6')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setDrops(list.map(p => ({
          id: p._id,
          slug: p.slug,
          name: p.name,
          segment: p.segment,
          image: p.images?.[0],
          color: getSegmentAccent(p.segment),
          price: p.price,
          mrp: p.mrp,
        })));
      })
      .catch(() => {});
  }, [initialDrops]);

  const handleMouseEnter = () => {
    setCursorVariant('text');
    setCursorText('VIEW');
  };

  const handleMouseLeave = () => {
    resetCursor();
  };

  if (drops.length === 0) return null;

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
          {drops.map((item, index) => (
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
                href={`/product/${item.slug}`}
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
                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{item.price}</span>
                    {item.mrp > item.price && <span className={styles.mrp}>₹{item.mrp}</span>}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
