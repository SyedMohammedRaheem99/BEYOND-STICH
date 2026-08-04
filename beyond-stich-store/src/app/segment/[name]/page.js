'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENTS } from '@/lib/constants';
import { getProductsBySegment } from '@/lib/data/products';
import SegmentHero from '@/components/segment/SegmentHero';
import ProductCard from '@/components/product/ProductCard';
import { RevealOnScroll } from '@/components/ui/AnimatedText';
import styles from './page.module.css';

export default function SegmentWorldPage(props) {
  const params = use(props.params);
  const segmentName = params?.name?.toUpperCase();
  
  const segmentData = SEGMENTS.find(s => s.name === segmentName);
  
  if (!segmentData) {
    notFound();
  }

  // Products for this segment via the data-access layer
  const segmentProducts = getProductsBySegment(segmentData.name);

  return (
    <div 
      className={styles.segmentWorld}
      style={{ '--world-accent': segmentData.accent }}
    >
      <SegmentHero segmentData={segmentData} />

      <main className={`${styles.mainContent} container noise-overlay`}>
        
        {/* Curated Editorial Section */}
        <RevealOnScroll className={styles.editorialGrid}>
          <div className={styles.editorialQuote}>
            <div className={styles.verticalAccent} />
            <blockquote>
              "IN THIS WORLD, BASIC DOESN'T EXIST. WE BUILT THIS COLLECTION TO REFLECT THE MINDSET OF THE {segmentData.name} HUSTLE."
            </blockquote>
          </div>
          <div className={styles.editorialStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{segmentProducts.length}</span>
              <span className={styles.statLabel}>EXCLUSIVE DROPS</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>100%</span>
              <span className={styles.statLabel}>PREMIUM FIT</span>
            </div>
          </div>
        </RevealOnScroll>

        {/* Drops Display */}
        <section className={styles.dropsSection}>
          <div className={styles.sectionHeader}>
            <h2>THE {segmentData.name} ARSENAL</h2>
            <div className={styles.headerLine} />
          </div>

          <AnimatePresence mode="popLayout">
            {segmentProducts.length > 0 ? (
              <div className={styles.productGrid}>
                {segmentProducts.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3>DROPS INCOMING.</h3>
                <p>The {segmentData.name} collection is currently being forged. Check back soon.</p>
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
