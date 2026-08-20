'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENTS } from '@/lib/constants';
import ProductCard from '@/components/product/ProductCard';
import ShopBanner from '@/components/home/ShopBanner';
import styles from './page.module.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Biggest Discount' },
];

const TRUST_ITEMS = [
  { icon: '🔒', text: 'Secure Payments' },
  { icon: '🚚', text: 'Free Shipping ₹999+' },
  { icon: '↩️', text: '7-Day Easy Returns' },
  { icon: '💎', text: '240 GSM Premium' },
  { icon: '📦', text: 'Cash on Delivery' },
];

function ShopContent({ initialProducts }) {
  const searchParams = useSearchParams();
  const [activeSegment, setActiveSegment] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [allProducts, setAllProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Fetch products from API whenever segment or sort changes
  useEffect(() => {
    // Skip the initial fetch — we already have server-rendered products
    if (activeSegment === 'ALL' && sortBy === 'newest') return;

    setLoading(true);
    setLoadError(false);
    const params = new URLSearchParams({ sort: sortBy });
    if (activeSegment !== 'ALL') params.set('segment', activeSegment);
    fetch(`/api/products?${params}`)
      .then(res => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(data => { setAllProducts(Array.isArray(data) ? data : []); })
      // Swallowing this showed "NO DROPS FOUND" on a flaky connection,
      // which reads as "this segment is empty" rather than "try again".
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [activeSegment, sortBy, retryCount]);

  // Client-side text search filter
  const filteredProducts = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.segment.toLowerCase().includes(q)
    );
  })();

  const resetAll = () => {
    setActiveSegment('ALL');
    setQuery('');
    setSortBy('newest');
  };

  return (
    <div className={styles.shopPage}>
      {/* ---- Promotional Banner Carousel ---- */}
      <div className={styles.bannerSection}>
        <div className="container">
          <ShopBanner />
        </div>
      </div>

      {/* ---- Trust / Benefits Strip ---- */}
      <div className={styles.trustStrip}>
        <div className={styles.trustTrack}>
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
            <div key={i} className={styles.trustItem}>
              <span className={styles.trustIcon}>{item.icon}</span>
              <span className={styles.trustText}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The "ALL DROPS" H1 now lives in ShopHero (server-rendered, above
          this component), so only the live product count remains here —
          two H1s saying the same thing helps nobody. */}
      <header className={`${styles.header} ${styles.headerCompact} noise-overlay`}>
        <div className="container">
          <motion.p
            className={styles.count}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
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
              <h2>{loadError ? "COULDN'T LOAD DROPS" : 'NO DROPS FOUND'}</h2>
              <p>
                {loadError
                  ? 'Check your connection and try again.'
                  : query
                    ? `Nothing matches "${query}". Try a different search or segment.`
                    : 'Try switching to a different segment world.'}
              </p>
              {loadError ? (
                <button className={styles.resetBtn} onClick={() => setRetryCount((c) => c + 1)}>
                  RETRY
                </button>
              ) : (
                <button className={styles.resetBtn} onClick={resetAll}>
                  RESET FILTERS
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

export default function ShopClient({ initialProducts }) {
  return (
    <Suspense fallback={null}>
      <ShopContent initialProducts={initialProducts} />
    </Suspense>
  );
}
