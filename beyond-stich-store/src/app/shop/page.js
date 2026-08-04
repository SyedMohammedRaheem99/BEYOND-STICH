'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENTS } from '@/lib/constants';
import { getAllProducts } from '@/lib/data/products';
import ProductCard from '@/components/product/ProductCard';
import styles from './page.module.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Biggest Discount' },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const [activeSegment, setActiveSegment] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  // Initialise from ?q= so the server renders the filtered set (no flash).
  const [query, setQuery] = useState(() => searchParams.get('q') || '');

  // Keep the search box in sync if the ?q= param changes after mount.
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Segment + sort via the data-access layer; free-text search on top.
  const filteredProducts = useMemo(() => {
    const base = getAllProducts({ segment: activeSegment, sort: sortBy });
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.segment.toLowerCase().includes(q)
    );
  }, [activeSegment, sortBy, query]);

  const resetAll = () => {
    setActiveSegment('ALL');
    setQuery('');
    setSortBy('newest');
  };

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
            SHOWING {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'PRODUCT' : 'PRODUCTS'}
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
          {SEGMENTS.map((segment) => (
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

      {/* Search + Sort toolbar */}
      <div className={styles.toolbar}>
        <div className={`${styles.toolbarInner} container`}>
          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search drops…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search drops by name or segment"
            />
          </div>

          <label className={styles.sortWrap}>
            <span className={styles.sortLabel}>Sort</span>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
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
              <p>
                {query
                  ? `Nothing matches “${query}”. Try a different search or segment.`
                  : 'Try switching to a different segment world.'}
              </p>
              <button className={styles.resetBtn} onClick={resetAll}>
                RESET FILTERS
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}
