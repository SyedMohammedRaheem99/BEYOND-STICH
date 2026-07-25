'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';
import { getSegmentAccent } from '@/lib/constants';
import { useCartStore, useWishlistStore } from '@/lib/store';
import ProductGallery from '@/components/product/ProductGallery';
import ReviewSection from '@/components/product/ReviewSection';
import MagneticButton from '@/components/ui/MagneticButton';
import styles from './page.module.css';

export default function ProductDetailPage(props) {
  const params = use(props.params);
  const slug = params?.slug;
  
  // Find product from dummy data. Remove this when DB is connected.
  const product = DUMMY_PRODUCTS.find(p => p.slug === slug);
  
  if (!product) {
    notFound();
  }

  const [selectedSize, setSelectedSize] = useState(null);
  const [viewers, setViewers] = useState(12);
  const { addItem, openCart } = useCartStore();
  const { items: wishlistItems, addToWishlist, removeFromWishlist } = useWishlistStore();

  useEffect(() => {
    // Simulate live viewers fluctuating
    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = prev + change;
        return next < 5 ? 5 : next > 45 ? 45 : next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  
  const accentColor = getSegmentAccent(product.segment);
  const isWishlisted = wishlistItems.some(i => i._id === product._id);
  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, product.colors[0]);
  };

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

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
                    <span className={styles.discount}>({discountPercent}% OFF)</span>
                  </>
                )}
              </div>
            </div>

            {/* Social Proof */}
            <div className={styles.socialProof}>
              <span className={styles.pulseActive} />
              <span>{viewers} people are viewing this right now</span>
            </div>

            {/* Sizes */}
            <div className={styles.sizesSection}>
              <div className={styles.sizesHeader}>
                <h3>SELECT SIZE</h3>
                <button className={styles.sizeGuideBtn}>SIZE GUIDE</button>
              </div>
              
              <div className={styles.sizeGrid}>
                {product.sizes.map(({ size, stock }) => (
                  <button
                    key={size}
                    onClick={() => stock > 0 && setSelectedSize(size)}
                    disabled={stock === 0}
                    className={`
                      ${styles.sizeBtn} 
                      ${selectedSize === size ? styles.sizeSelected : ''} 
                      ${stock === 0 ? styles.sizeOos : ''}
                    `}
                    style={selectedSize === size ? { borderColor: accentColor, color: accentColor } : {}}
                  >
                    <span>{size}</span>
                    {stock === 0 && <span className={styles.stockLabel}>OOS</span>}
                    {stock > 0 && stock <= 3 && <span className={styles.stockLabel}>{stock} Left</span>}
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
                {selectedSize ? `ADD TO BAG — ₹${product.price}` : 'SELECT A SIZE'}
              </button>
              
              <button 
                className={styles.wishlistBtn}
                onClick={handleWishlist}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isWishlisted ? accentColor : 'none'} stroke={isWishlisted ? accentColor : 'currentColor'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Details Accordion */}
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
            <ReviewSection productId={product._id} accentColor={accentColor} />

          </div>
        </div>
      </div>
    </div>
  );
}
