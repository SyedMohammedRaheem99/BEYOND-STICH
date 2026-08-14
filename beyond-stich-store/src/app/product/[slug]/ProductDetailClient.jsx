'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { discountPercent } from '@/lib/utils';
import { getSegmentAccent, getColorHex, SIZE_LOW_STOCK_THRESHOLD } from '@/lib/constants';
import { useCartStore, useWishlistStore } from '@/lib/store';
import ProductGallery from '@/components/product/ProductGallery';
import ProductCard from '@/components/product/ProductCard';
import ReviewSection from '@/components/product/ReviewSection';
import SizeGuideModal from '@/components/product/SizeGuideModal';
import styles from './page.module.css';

export default function ProductDetailClient({ product, relatedProducts, initialReviewData }) {
  const [reviewData, setReviewData] = useState(initialReviewData);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [added, setAdded] = useState(false);

  const { addItem } = useCartStore();
  const { items: wishlistItems, addToWishlist, removeFromWishlist } = useWishlistStore();

  const accentColor = getSegmentAccent(product.segment);
  const isWishlisted = wishlistItems.some(i => i._id === product._id);
  const discount = discountPercent(product);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const checkDelivery = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setDelivery({ ok: false, msg: 'Enter a valid 6-digit PIN code' });
      return;
    }
    const fast = /^[14578]/.test(pincode.trim());
    const days = fast ? 3 : 6;
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDelivery({
      ok: true,
      msg: `Delivery by ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
    });
  };

  const handleWishlist = () => {
    if (isWishlisted) removeFromWishlist(product._id);
    else addToWishlist(product);
  };

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?slug=${encodeURIComponent(product.slug)}`);
      if (res.ok) setReviewData(await res.json());
    } catch {}
  }, [product.slug]);

  return (
    <div className={styles.pdp}>
      {/* Breadcrumb */}
      <div className={`${styles.breadcrumb} container`}>
        <Link href="/">HOME</Link>
        <span className={styles.separator}>/</span>
        <Link href="/shop">ALL DROPS</Link>
        <span className={styles.separator}>/</span>
        <Link href={`/segment/${product.segment.toLowerCase()}`}>{product.segment}</Link>
        <span className={styles.separator}>/</span>
        <span className={styles.current}>{product.name}</span>
      </div>

      <div className={`${styles.grid} container`}>
        {/* Left: Sticky Gallery */}
        <div className={styles.galleryCol}>
          <ProductGallery images={product.images} name={product.name} />
        </div>

        {/* Right: Product Info */}
        <div className={styles.infoCol}>
          <div className={styles.infoSticky}>

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.segmentRow}>
                <span className={styles.segmentBadge} style={{ color: accentColor }}>
                  {product.segment}
                </span>
                <span className={styles.fitType}>{product.fitType}</span>
              </div>
              <h1 className={styles.title}>{product.name}</h1>
              <div className={styles.priceRow}>
                <span className={styles.price}>₹{product.price}</span>
                {product.mrp > product.price && (
                  <>
                    <span className={styles.mrp}>₹{product.mrp}</span>
                    <span className={styles.discount}>({discount}% OFF)</span>
                  </>
                )}
              </div>
            </div>

            {/* Social proof */}
            {reviewData.count > 0 && (
              <div className={styles.socialProof}>
                <span className={styles.proofStars} style={{ color: accentColor }}>
                  {'★'.repeat(Math.round(reviewData.average))}{'☆'.repeat(5 - Math.round(reviewData.average))}
                </span>
                <span>{reviewData.average} · {reviewData.count} {reviewData.count === 1 ? 'review' : 'reviews'}</span>
              </div>
            )}

            {/* Color selection */}
            {product.colors?.length > 0 && (
              <div className={styles.colorSection}>
                <div className={styles.colorHeader}>
                  <h3>COLOR</h3>
                  <span className={styles.colorName}>{selectedColor}</span>
                </div>
                <div className={styles.colorGrid}>
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      className={`${styles.colorSwatch} ${selectedColor === c ? styles.colorSelected : ''}`}
                      style={{
                        backgroundColor: getColorHex(c),
                        outlineColor: selectedColor === c ? accentColor : 'transparent',
                      }}
                      onClick={() => setSelectedColor(c)}
                      aria-label={`Select color ${c}`}
                      aria-pressed={selectedColor === c}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            <div className={styles.sizesSection} id="pdp-sizes">
              <div className={styles.sizesHeader}>
                <h3>SELECT SIZE</h3>
                <button className={styles.sizeGuideBtn} onClick={() => setSizeGuideOpen(true)}>
                  SIZE GUIDE
                </button>
              </div>
              <div className={styles.sizeGrid}>
                {product.sizes.map(({ size, stock }) => (
                  <button
                    key={size}
                    onClick={() => stock > 0 && setSelectedSize(size)}
                    disabled={stock === 0}
                    className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeSelected : ''} ${stock === 0 ? styles.sizeOos : ''}`}
                    style={selectedSize === size ? { borderColor: accentColor, color: accentColor } : {}}
                  >
                    <span>{size}</span>
                    {stock === 0 && <span className={styles.stockLabel}>OOS</span>}
                    {stock > 0 && stock <= SIZE_LOW_STOCK_THRESHOLD && <span className={styles.stockLabel}>{stock} Left</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                className={`${styles.addToCartBtn} ${!selectedSize ? styles.disabled : ''}`}
                onClick={handleAddToCart}
                style={{ backgroundColor: selectedSize ? accentColor : '' }}
                disabled={!selectedSize}
              >
                {added ? 'ADDED TO BAG ✓' : selectedSize ? `ADD TO BAG — ₹${product.price}` : 'SELECT A SIZE'}
              </button>
              <button className={styles.wishlistBtn} onClick={handleWishlist}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isWishlisted ? accentColor : 'none'} stroke={isWishlisted ? accentColor : 'currentColor'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Estimated delivery — always visible */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '12px',
              fontSize: 'var(--text-sm)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" aria-hidden="true">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <div>
                <span style={{ color: '#22C55E', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                  {(() => {
                    const d1 = new Date(); d1.setDate(d1.getDate() + 3);
                    const d2 = new Date(); d2.setDate(d2.getDate() + 6);
                    const fmt = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    return `GET IT BY ${fmt(d1).toUpperCase()} – ${fmt(d2).toUpperCase()}`;
                  })()}
                </span>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                  {product.price >= 999 ? 'FREE SHIPPING' : 'Free shipping on orders above ₹999'}
                </span>
              </div>
            </div>

            {/* Pincode delivery check */}
            <form className={styles.delivery} onSubmit={checkDelivery}>
              <div className={styles.deliveryRow}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter PIN code to check delivery"
                  className={styles.deliveryInput}
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value); setDelivery(null); }}
                  aria-label="Delivery PIN code"
                />
                <button type="submit" className={styles.deliveryBtn}>CHECK</button>
              </div>
              {delivery && (
                <p className={`${styles.deliveryMsg} ${delivery.ok ? styles.deliveryOk : styles.deliveryErr}`}>
                  {delivery.msg}
                </p>
              )}
            </form>

            {/* Trust row */}
            <div className={styles.trustRow}>
              <span className={styles.trustItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Secure checkout
              </span>
              <span className={styles.trustItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                7-day easy returns
              </span>
              <span className={styles.trustItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                Cash on delivery
              </span>
            </div>

            {/* Details */}
            <div className={styles.details}>
              <div className={styles.detailBlock}>
                <h4>THE DROP</h4>
                <p>{product.description}</p>
              </div>
              <div className={styles.detailBlock}>
                <h4>MATERIAL & BUILD</h4>
                <p>{product.material || 'Heavyweight 240 GSM Cotton'}. Double stitched shoulders. High density print.</p>
              </div>
              <div className={styles.detailBlock}>
                <h4>SHIPPING</h4>
                <p>Free shipping on orders above ₹999. Usually dispatches in 24 hours.</p>
              </div>
            </div>

            {/* Reviews */}
            <ReviewSection
              productSlug={product.slug}
              accentColor={accentColor}
              reviews={reviewData.reviews}
              average={reviewData.average}
              count={reviewData.count}
              distribution={reviewData.distribution}
              onSubmitted={fetchReviews}
            />
          </div>
        </div>
      </div>

      {/* You may also like */}
      {relatedProducts.length > 0 && (
        <section className={`${styles.related} container`}>
          <div className={styles.relatedHeader}>
            <h2>YOU MAY ALSO LIKE</h2>
            <Link href={`/segment/${product.segment.toLowerCase()}`} className={styles.relatedLink}>
              MORE {product.segment} →
            </Link>
          </div>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Size guide modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        accentColor={accentColor}
      />

      {/* Sticky mobile add-to-cart */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyInfo}>
          <span className={styles.stickyPrice}>₹{product.price}</span>
          {product.mrp > product.price && <span className={styles.stickyMrp}>₹{product.mrp}</span>}
        </div>
        <button
          className={styles.stickyBtn}
          onClick={selectedSize ? handleAddToCart : () => document.getElementById('pdp-sizes')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          style={{ backgroundColor: selectedSize ? accentColor : '' }}
        >
          {selectedSize ? 'ADD TO BAG' : 'SELECT SIZE'}
        </button>
      </div>
    </div>
  );
}
