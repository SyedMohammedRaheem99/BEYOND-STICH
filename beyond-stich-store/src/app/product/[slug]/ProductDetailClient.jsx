'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { discountPercent } from '@/lib/utils';
import { getSegmentAccent, getColorHex, SIZE_LOW_STOCK_THRESHOLD, SHIPPING } from '@/lib/constants';
import { useCartStore, useWishlistStore } from '@/lib/store';
import {
  trackViewItem,
  trackAddToCart,
  trackAddToWishlist,
  trackDeliveryCheck,
} from '@/lib/analytics';
import ProductGallery from '@/components/product/ProductGallery';
import ProductCard from '@/components/product/ProductCard';
import ReviewSection from '@/components/product/ReviewSection';
import SizeGuideModal from '@/components/product/SizeGuideModal';
import styles from './page.module.css';

export default function ProductDetailClient({ product, relatedProducts, initialReviewData, sizeChart = null }) {
  const [reviewData, setReviewData] = useState(initialReviewData);
  const [selectedSize, setSelectedSize] = useState(null);
  // Restock alerts for a sold-out size.
  const [notifySize, setNotifySize] = useState(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const { addItem } = useCartStore();
  const { items: wishlistItems, addToWishlist, removeFromWishlist } = useWishlistStore();

  const accentColor = getSegmentAccent(product.segment);
  const isWishlisted = wishlistItems.some(i => i._id === product._id);
  const discount = discountPercent(product);

  // Sold-out sizes are selectable now (they open the notify-me form), so the
  // add-to-cart path has to check stock rather than just "a size is picked".
  const selectedSizeStock =
    product.sizes?.find((s) => s.size === selectedSize)?.stock ?? 0;

  // Fired once per product view. A ref rather than an empty dep array so
  // a client-side navigation between two products still reports both.
  const viewedSlug = useRef(null);
  useEffect(() => {
    if (!product?.slug || viewedSlug.current === product.slug) return;
    viewedSlug.current = product.slug;
    trackViewItem(product);
  }, [product]);

  const handleAddToCart = () => {
    if (!selectedSize || selectedSizeStock <= 0) return;
    addItem(product, selectedSize, selectedColor);
    trackAddToCart(product, { size: selectedSize, color: selectedColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const submitNotify = async (e) => {
    e.preventDefault();
    if (notifyLoading) return;
    setNotifyLoading(true);
    setNotifyMsg('');

    try {
      const res = await fetch('/api/notify-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: product.slug, size: notifySize, email: notifyEmail }),
      });
      const data = await res.json();
      setNotifyMsg(data.error || data.message);
      if (res.ok) setNotifyEmail('');
    } catch {
      setNotifyMsg('Network error. Please try again.');
    } finally {
      setNotifyLoading(false);
    }
  };

  // Asks the server, which holds the actual delivery areas. This used to be
  // decided here in the browser from `/^[14578]/.test(pincode) ? 3 : 6` —
  // so every six-digit number got a confident delivery date, including PIN
  // codes we don't ship to, and the customer only found out when the COD
  // parcel never arrived.
  const checkDelivery = async (e) => {
    e.preventDefault();
    const pin = pincode.trim();

    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setDelivery({ ok: false, msg: 'Enter a valid 6-digit PIN code' });
      return;
    }

    setDeliveryLoading(true);
    try {
      const res = await fetch(`/api/delivery/check?pincode=${encodeURIComponent(pin)}`);
      const data = await res.json();

      trackDeliveryCheck(pin, Boolean(data.serviceable));

      setDelivery(
        data.serviceable
          ? {
              ok: true,
              msg: data.etaLabel,
              // Shown alongside the date — a customer planning to pay cash
              // needs to know before checkout, not at the payment step.
              cod: data.codAvailable,
            }
          : { ok: false, msg: data.reason || "We don't deliver here yet." }
      );
    } catch {
      setDelivery({ ok: false, msg: 'Could not check delivery. Please try again.' });
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
      trackAddToWishlist(product);
    }
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
            <div>
              <div className={styles.segmentRow}>
                <span className={styles.segmentBadge} style={{ color: accentColor }}>
                  {product.segment}
                </span>
                {/* fitType no longer defaults to 'Oversized' — a hoodie or
                    a cap has no such attribute — so it can legitimately be
                    empty, and an unguarded render left a stray element. */}
                {product.fitType && (
                  <span className={styles.fitType}>{product.fitType}</span>
                )}
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
                  <h2>COLOR</h2>
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
                <h2>SELECT SIZE</h2>
                <button className={styles.sizeGuideBtn} onClick={() => setSizeGuideOpen(true)}>
                  SIZE GUIDE
                </button>
              </div>
              <div className={styles.sizeGrid}>
                {product.sizes.map(({ size, stock }) => (
                  <button
                    key={size}
                    // Sold-out sizes are now selectable so they can open the
                    // notify-me form. Previously they were disabled and the
                    // customer had no way to signal demand.
                    onClick={() => {
                      setSelectedSize(size);
                      if (stock === 0) {
                        setNotifySize(size);
                        setNotifyMsg('');
                      } else {
                        setNotifySize(null);
                      }
                    }}
                    aria-pressed={selectedSize === size}
                    className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeSelected : ''} ${stock === 0 ? styles.sizeOos : ''}`}
                    style={selectedSize === size ? { borderColor: accentColor, color: accentColor } : {}}
                  >
                    <span>{size}</span>
                    {stock === 0 && <span className={styles.stockLabel}>OOS</span>}
                    {stock > 0 && stock <= SIZE_LOW_STOCK_THRESHOLD && <span className={styles.stockLabel}>{stock} Left</span>}
                  </button>
                ))}
              </div>

              {notifySize && (
                <form className={styles.notifyForm} onSubmit={submitNotify}>
                  <p className={styles.notifyLead}>
                    Size {notifySize} is sold out. Leave your email and we&apos;ll tell
                    you the moment it&apos;s back.
                  </p>
                  <div className={styles.notifyRow}>
                    <input
                      type="email"
                      className={styles.notifyInput}
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      aria-label="Email for restock alert"
                    />
                    <button type="submit" className={styles.notifyBtn} disabled={notifyLoading}>
                      {notifyLoading ? '…' : 'NOTIFY ME'}
                    </button>
                  </div>
                  {notifyMsg && <p className={styles.notifyMsg}>{notifyMsg}</p>}
                </form>
              )}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                className={`${styles.addToCartBtn} ${!selectedSize || selectedSizeStock <= 0 ? styles.disabled : ''}`}
                onClick={handleAddToCart}
                disabled={!selectedSize || selectedSizeStock <= 0}
              >
                {added
                  ? 'ADDED TO BAG ✓'
                  : !selectedSize
                    ? 'SELECT A SIZE'
                    : selectedSizeStock <= 0
                      ? 'SOLD OUT — GET RESTOCK ALERT'
                      : `ADD TO BAG — ₹${product.price}`}
              </button>
              <button
                className={styles.wishlistBtn}
                onClick={handleWishlist}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={isWishlisted}
              >
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill={isWishlisted ? accentColor : 'none'} stroke={isWishlisted ? accentColor : 'currentColor'} strokeWidth="2">
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
                {/* Was a hardcoded "GET IT BY <today+3> – <today+6>",
                    promising a delivery window before knowing where to. The
                    date now only appears once a PIN code has been checked;
                    until then this prompts for one. */}
                <span style={{ color: delivery?.ok ? 'var(--color-success)' : 'var(--color-text-primary)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                  {delivery?.ok ? delivery.msg.toUpperCase() : 'CHECK DELIVERY TO YOUR AREA'}
                </span>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: 'var(--text-2xs)', marginTop: '2px' }}>
                  {product.price >= SHIPPING.FREE_THRESHOLD
                    ? 'FREE SHIPPING'
                    : `Free shipping on orders above ₹${SHIPPING.FREE_THRESHOLD}`}
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
                <button type="submit" className={styles.deliveryBtn} disabled={deliveryLoading}>
                  {deliveryLoading ? '…' : 'CHECK'}
                </button>
              </div>
              {delivery && (
                <p className={`${styles.deliveryMsg} ${delivery.ok ? styles.deliveryOk : styles.deliveryErr}`}>
                  {delivery.msg}
                  {/* Only ever shown for a serviceable PIN code. Someone
                      planning to pay cash needs to know now, not after
                      filling in the whole checkout form. */}
                  {delivery.ok && delivery.cod === false && (
                    <span style={{ display: 'block', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Prepaid only — cash on delivery isn&apos;t available here.
                    </span>
                  )}
                </p>
              )}
            </form>

            {/* Trust row */}
            <div className={styles.trustRow}>
              <span className={styles.trustItem}>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Secure checkout
              </span>
              {/* Linked, not plain text: for an unknown brand taking COD the
                  returns policy is the thing customers check before buying. */}
              <Link href="/returns" className={styles.trustItem}>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                7-day easy returns
              </Link>
              <span className={styles.trustItem}>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                Cash on delivery
              </span>
            </div>

            {/* Details.
                Every block here is product data now. "MATERIAL & BUILD"
                used to append "Double stitched shoulders. High density
                print." to all 35 products whether or not it was true, and
                "SHIPPING" was the same sentence on every page. */}
            <div className={styles.details}>
              {product.highlights?.length > 0 && (
                <div className={styles.detailBlock}>
                  <h2>HIGHLIGHTS</h2>
                  <ul className={styles.highlights}>
                    {product.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.detailBlock}>
                <h2>THE DROP</h2>
                <p>{product.description}</p>
              </div>

              {product.specs?.length > 0 && (
                <div className={styles.detailBlock}>
                  <h2>SPECIFICATIONS</h2>
                  {/* A definition list, not a table: it reads correctly to a
                      screen reader and reflows to one column on a phone
                      without horizontal scrolling. */}
                  <dl className={styles.specList}>
                    {product.specs.map((s, i) => (
                      <div key={i} className={styles.specRow}>
                        <dt>{s.label}</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {product.material && (
                <div className={styles.detailBlock}>
                  <h2>MATERIAL</h2>
                  <p>{product.material}</p>
                </div>
              )}

              {product.careInstructions && (
                <div className={styles.detailBlock}>
                  <h2>CARE</h2>
                  <p>{product.careInstructions}</p>
                </div>
              )}

              <div className={styles.detailBlock}>
                <h2>SHIPPING</h2>
                <p>
                  {/* Reflects the PIN code the customer actually checked,
                      rather than asserting a delivery window for everyone. */}
                  {delivery?.ok
                    ? `${delivery.msg} to ${pincode}.`
                    : `Free shipping on orders above ₹${SHIPPING.FREE_THRESHOLD}.`}
                  {' '}Dispatched within 24 hours.
                </p>
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
        chart={sizeChart}
        productType={product.productType}
        selectedSize={selectedSize}
      />

      {/* Sticky mobile add-to-cart */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyInfo}>
          <span className={styles.stickyPrice}>₹{product.price}</span>
          {product.mrp > product.price && <span className={styles.stickyMrp}>₹{product.mrp}</span>}
        </div>
        <button
          className={styles.stickyBtn}
          onClick={
            selectedSize && selectedSizeStock > 0
              ? handleAddToCart
              : () =>
                  document
                    .getElementById('pdp-sizes')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        >
          {!selectedSize
            ? 'SELECT SIZE'
            : selectedSizeStock <= 0
              ? 'SOLD OUT'
              : 'ADD TO BAG'}
        </button>
      </div>
    </div>
  );
}
