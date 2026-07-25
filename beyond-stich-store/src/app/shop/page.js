'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENTS } from '@/lib/constants';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';
import ProductCard from '@/components/product/ProductCard';
import styles from './page.module.css';

export default function ShopPage() {
  const [activeSegment, setActiveSegment] = useState('ALL');

  // Filter products by segment
  const filteredProducts = activeSegment === 'ALL' 
    ? DUMMY_PRODUCTS 
    : DUMMY_PRODUCTS.filter(p => p.segment === activeSegment);

  return (
    <div className={styles.shopPage}>
      {/* Header */}
      <header className={`${styles.header} noise-overlay`}>
        <div className="container">
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            ALL DROPS
          </motion.h1>
          <motion.p 
            className={styles.count}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            SHOWING {filteredProducts.length} PRODUCTS
          </motion.p>
        </div>
      </header>

      {/* Segment Filters */}
      <div className={styles.filterStrip}>
        <div className={`${styles.filterScroll} container`}>
          <button 
            className={`${styles.filterPill} ${activeSegment === 'ALL' ? styles.activePill : ''}`}
            onClick={() => setActiveSegment('ALL')}
          >
            ALL
          </button>
          {SEGMENTS.map(segment => (
            <button
              key={segment.id}
              className={`${styles.filterPill} ${activeSegment === segment.name ? styles.activePill : ''}`}
              onClick={() => setActiveSegment(segment.name)}
              style={{
                '--hover-accent': segment.accent,
                '--active-accent': activeSegment === segment.name ? segment.accent : 'transparent',
              }}
            >
              {segment.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <section className={`${styles.productSection} container`}>
        <AnimatePresence mode="popLayout">
          {filteredProducts.length > 0 ? (
            <motion.div 
              className={styles.grid}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {filteredProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className={styles.emptyState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2>NO DROPS FOUND</h2>
              <p>Try switching to a different segment world.</p>
              <button 
                className={styles.resetBtn}
                onClick={() => setActiveSegment('ALL')}
              >
                VIEW ALL DROPS
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
