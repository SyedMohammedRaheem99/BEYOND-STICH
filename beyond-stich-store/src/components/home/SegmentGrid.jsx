'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { SEGMENTS, getSegmentImage } from '@/lib/constants';
import { useUIStore } from '@/lib/store';
import styles from './SegmentGrid.module.css';

export default function SegmentGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { setCursorVariant, setCursorText, resetCursor } = useUIStore();

  const handleMouseEnter = (name) => {
    setCursorVariant('text');
    setCursorText('ENTER');
  };

  const handleMouseLeave = () => {
    resetCursor();
  };

  return (
    <section className={styles.section} ref={ref}>
      <div className="container">
        <motion.p
          className={styles.label}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          EXPLORE WORLDS
        </motion.p>

        <div className={styles.grid}>
          {SEGMENTS.filter(s => s.id !== 'randoms').map((segment, i) => (
            <motion.div
              key={segment.id}
              className={`${styles.tile} ${getTileSize(i)}`}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={`/segment/${segment.id}`}
                className={styles.tileLink}
                onMouseEnter={() => handleMouseEnter(segment.name)}
                onMouseLeave={handleMouseLeave}
                style={{
                  '--tile-accent': segment.accent,
                  '--tile-glow': `${segment.accent}33`,
                }}
              >
                <div className={styles.tileImage}>
                  <Image
                    src={getSegmentImage(segment.name)}
                    alt={`${segment.name} world`}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.tileGradient} />
                <div className={styles.tileOverlay} />
                <div className={styles.tileContent}>
                  <span className={styles.tileName}>{segment.name}</span>
                  <span className={styles.tileTagline}>{segment.tagline}</span>
                </div>
                <div className={styles.tileAccentLine} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getTileSize(index) {
  // Create visual rhythm with different tile sizes
  const pattern = [
    styles.tileLarge,   // GYM
    styles.tileMedium,  // COFFEE
    styles.tileMedium,  // MILLIONAIRE
    styles.tileLarge,   // MUSIC
    styles.tileMedium,  // GAMER
    styles.tileLarge,   // CARS
    styles.tileLarge,   // BIKE
    styles.tileMedium,  // SUMMER
    styles.tileMedium,  // FLORAL
    styles.tileLarge,   // SPORTS
    styles.tileMedium,  // VALENTINE
    styles.tileMedium,  // TYPOGRAPHY
  ];
  return pattern[index] || styles.tileMedium;
}
