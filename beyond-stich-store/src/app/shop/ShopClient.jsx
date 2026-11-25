'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENTS } from '@/lib/constants';
import ProductCard from '@/components/product/ProductCard';
import Skeleton from '@/components/ui/Skeleton';
import ShopBanner from '@/components/home/ShopBanner';
import { trackSearch } from '@/lib/analytics';
import styles from './page.module.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Biggest Discount' },
];

// Four facts, stated once and held still.
//
// This was five emoji (🔒 🚚 ↩️ 💎 📦) scrolling on a 25s infinite marquee.
// Emoji render differently on every OS — ↩️ is a blue arrow on Windows and a
// grey one on macOS — so the strip's look wasn't ours to control, and an item
// slid away before it could be finished. Stroke icons match the navbar set.
// "Secure Payments" was dropped: the Razorpay badge at checkout makes that
// claim where it actually matters.
const TRUST_ITEMS = [
  {
    text: 'Free Shipping',
    path: 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.5 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  { text: 'Cash on Delivery', path: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  { text: '7-Day Easy Returns', path: 'M3 10h12a4 4 0 0 1 0 8h-5M3 10l4-4M3 10l4 4' },
  { text: '240 GSM Premium', path: 'M12 2 4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z' },
];

function ShopContent({ initialProducts, banners, segments = [] }) {
  // Filter pills from the collection, so a world added in the admin is
  // filterable at once. Falls back to the constant on a DB outage.
  const segmentList = (segments.length ? segments : SEGMENTS).map((s) => ({
    ...s,
    id: s.slug || s.id,
  }));

  const searchParams = useSearchParams();
  const [activeSegment, setActiveSegment] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [allProducts, setAllProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Counts come from the server-rendered full catalogue, not `allProducts` —
  // that array is replaced by the per-segment fetch below, so deriving counts
  // from it would show every category as 0 the moment one was selected.
  const segmentCounts = useMemo(() => {
    const counts = { ALL: initialProducts.length };
    for (const p of initialProducts) {
      if (p.segment) counts[p.segment] = (counts[p.segment] || 0) + 1;
    }
    return counts;
  }, [initialProducts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing state from a browser/session/URL source that is unavailable during render
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Fetch products from API whenever segment or sort changes
  useEffect(() => {
    // Skip the initial fetch — we already have server-rendered products
    if (activeSegment === 'ALL' && sortBy === 'newest') return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing state from a browser/session/URL source that is unavailable during render
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

  // Debounced so a search is reported once the shopper stops typing,
  // rather than once per keystroke.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => trackSearch(q), 800);
    return () => clearTimeout(t);
  }, [query]);

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
      {/* ---- Hero carousel ----
           Was an inset card below a separate ShopHero band. Now it IS the
           hero: the artwork bleeds edge to edge like the home page's, while
           its copy stays inside the shared container so the headline lines up
           with the filters and product grid below. */}
      <div className={styles.heroSection}>
        <ShopBanner banners={banners} />
      </div>

      {/* ---- Catalogue: filter rail + grid ----
           This replaced three stacked full-width bands (trust strip, pill
           row, search/sort toolbar) that together ate 875px — 81% of a
           1080p screen — before the first product. The rail costs no
           vertical space at all, holds every segment without the horizontal
           scroll that was clipping the last pills, and leaves the grid
           starting directly under the hero.

           The trust strip was dropped here entirely: shipping and returns
           are decision-time information and already appear on the product
           page (with a live delivery estimate) and on the home TrustBar. */}
      <div className={`${styles.catalogue} container`}>
        <aside className={styles.rail} aria-label="Filter products">
          <div className={styles.railInner}>
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

            <h2 className={styles.railHeading}>Category</h2>
            <ul className={styles.railList}>
              <li>
                <button
                  className={`${styles.railItem} ${activeSegment === 'ALL' ? styles.railItemActive : ''}`}
                  onClick={() => setActiveSegment('ALL')}
                  aria-current={activeSegment === 'ALL' ? 'true' : undefined}
                >
                  <span>All Drops</span>
                  <span className={styles.railCount}>{segmentCounts.ALL ?? 0}</span>
                </button>
              </li>
              {segmentList.map((segment) => (
                <li key={segment.id}>
                  <button
                    className={`${styles.railItem} ${activeSegment === segment.name ? styles.railItemActive : ''} ${!segmentCounts[segment.name] ? styles.railItemEmpty : ''}`}
                    onClick={() => setActiveSegment(segment.name)}
                    aria-current={activeSegment === segment.name ? 'true' : undefined}
                    disabled={!segmentCounts[segment.name]}
                    style={{ '--seg-accent': segment.accent }}
                  >
                    <span>{segment.name}</span>
                    <span className={styles.railCount}>{segmentCounts[segment.name] ?? 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className={styles.results}>
          {/* One compact row above the grid. On mobile the Filter button
              opens the rail as a sheet; on desktop the rail is always
              visible and this just carries the count and sort. */}
          <div className={styles.resultsBar}>
            <button
              className={styles.filterBtn}
              onClick={() => setFiltersOpen(true)}
              aria-label="Open filters"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              Filter
              {activeSegment !== 'ALL' && <span className={styles.filterDot} aria-hidden="true" />}
            </button>

            <p className={styles.count} aria-live="polite">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>

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

      {/* Product Grid */}
      <section className={styles.productSection}>
        <AnimatePresence mode="popLayout">
          {filteredProducts.length > 0 ? (
            <motion.div
              className={styles.grid}
              initial="hidden"
              animate="visible"
              exit="hidden"
              // `loading` was tracked but never rendered, so changing the sort
              // on a slow connection left the old results on screen with no
              // feedback — the customer taps "Price: Low to High", sees no
              // change, and taps again.
              aria-busy={loading}
              style={{ opacity: loading ? 0.45 : 1, transition: 'opacity 0.2s' }}
            >
              {filteredProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </motion.div>
          ) : loading ? (
            /* Without this branch, a fetch that returns nothing *yet* fell
               through to the empty state below — so mid-load the customer was
               told "NO DROPS FOUND" for results that were still arriving. */
            <div className={styles.grid} aria-busy="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <Skeleton className={styles.skeletonImage} />
                  <Skeleton shape="text" width="40%" />
                  <Skeleton shape="text" width="75%" height="1.1em" />
                  <Skeleton shape="text" width="30%" />
                </div>
              ))}
            </div>
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
      </div>

      {/* Mobile filter sheet. The rail markup above is hidden under 1024px;
          this renders the same controls in a bottom sheet so a phone gets
          one 56px bar instead of a 49px pill strip plus a 170px toolbar. */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              className={styles.sheetOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              className={styles.sheet}
              role="dialog"
              aria-modal="true"
              aria-label="Filter products"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.sheetHead}>
                <h2 className={styles.railHeading}>Category</h2>
                <button
                  className={styles.sheetClose}
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
              <ul className={styles.railList}>
                <li>
                  <button
                    className={`${styles.railItem} ${activeSegment === 'ALL' ? styles.railItemActive : ''}`}
                    onClick={() => {
                      setActiveSegment('ALL');
                      setFiltersOpen(false);
                    }}
                  >
                    <span>All Drops</span>
                    <span className={styles.railCount}>{segmentCounts.ALL ?? 0}</span>
                  </button>
                </li>
                {segmentList.map((segment) => (
                  <li key={segment.id}>
                    <button
                      className={`${styles.railItem} ${activeSegment === segment.name ? styles.railItemActive : ''} ${!segmentCounts[segment.name] ? styles.railItemEmpty : ''}`}
                      onClick={() => {
                        setActiveSegment(segment.name);
                        setFiltersOpen(false);
                      }}
                      disabled={!segmentCounts[segment.name]}
                      style={{ '--seg-accent': segment.accent }}
                    >
                      <span>{segment.name}</span>
                      <span className={styles.railCount}>{segmentCounts[segment.name] ?? 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopClient({ initialProducts, banners, segments }) {
  return (
    <Suspense fallback={null}>
      <ShopContent initialProducts={initialProducts} banners={banners} segments={segments} />
    </Suspense>
  );
}
