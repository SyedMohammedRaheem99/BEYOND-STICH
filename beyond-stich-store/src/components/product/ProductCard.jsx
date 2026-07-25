'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore, useCartStore, useUIStore } from '@/lib/store';
import { getSegmentAccent } from '@/lib/constants';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, index = 0 }) {
  const [isHovered, setIsHovered] = useState(false);
  const { items: wishlistItems, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { openCart } = useCartStore();
  const { setCursorVariant, resetCursor } = useUIStore();
  
  const isWishlisted = wishlistItems.some(i => i._id === product._id);
  const accentColor = getSegmentAccent(product.segment);
  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  
  const handleWishlistToggle = (e) => {
    e.preventDefault(); // prevent triggering the link
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setCursorVariant('hover');
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    resetCursor();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/product/${product.slug}`}
        className={styles.card}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.imageContainer}>
          {/* Default Image */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`${styles.primaryImage} ${!product.images[1] ? styles.onlyImage : ''}`}
          />
          
          {/* Hover Image */}
          {product.images[1] && (
             <Image
             src={product.images[1]}
             alt={`${product.name} alternate view`}
             fill
             sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
             className={styles.secondaryImage}
           />
          )}

          {/* Scarcity / New Badges */}
          {product.tags?.includes('new') && (
            <span className={styles.badge} style={{ backgroundColor: accentColor, color: '#0A0A0A' }}>
              NEW DROP
            </span>
          )}

          {/* Wishlist Button */}
          <button 
            className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
            onClick={handleWishlistToggle}
            aria-label="Add to wishlist"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? accentColor : 'none'} stroke={isWishlisted ? accentColor : 'currentColor'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        <div className={styles.info}>
          <div className={styles.segmentLine}>
            <span className={styles.segmentName} style={{ color: accentColor }}>
              {product.segment}
            </span>
            <span className={styles.fitType}>{product.fitType}</span>
          </div>
          
          <h3 className={styles.productName}>{product.name}</h3>
          
          <div className={styles.pricing}>
            <span className={styles.price}>₹{product.price}</span>
            {product.mrp > product.price && (
              <>
                <span className={styles.mrp}>₹{product.mrp}</span>
                <span className={styles.discount}>({discountPercent}% OFF)</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
