'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/lib/store';
import styles from './ProductGallery.module.css';

export default function ProductGallery({ images, name }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const { setCursorVariant, setCursorText, resetCursor } = useUIStore();

  const handleMouseEnter = () => {
    setCursorVariant('text');
    setCursorText('ZOOM');
  };

  const handleMouseLeave = () => {
    resetCursor();
  };

  const handleImageClick = (i) => {
    setActiveIndex(i);
    setIsZoomed(true);
  };

  // Close the zoom overlay on Escape and lock body scroll while open.
  useEffect(() => {
    if (!isZoomed) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsZoomed(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isZoomed]);

  return (
    <div className={styles.gallery}>
      {/* Desktop Sticky View */}
      <div className={styles.desktopView}>
        {images.map((img, i) => (
          <div 
            key={i} 
            className={styles.imageBlock}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleImageClick(i)}
          >
            <Image
              src={img}
              alt={`${name} - View ${i + 1}`}
              fill
              sizes="50vw"
              priority={i === 0}
              className={`${styles.image} ${isZoomed && activeIndex === i ? styles.imageZoomed : ''}`}
            />
          </div>
        ))}
      </div>

      {/* Mobile Swipe View */}
      <div className={styles.mobileView}>
        <div className={styles.swipeContainer}>
          {images.map((img, i) => (
            <div key={i} className={styles.swipeItem}>
              <Image
                src={img}
                alt={`${name} - View ${i + 1}`}
                fill
                sizes="100vw"
                priority={i === 0}
                className={styles.image}
              />
            </div>
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className={styles.dots}>
          {images.map((_, i) => (
            <span 
              key={i} 
              className={`${styles.dot} ${i === 0 ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen Zoom overlay */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            className={styles.zoomOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} — enlarged image`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
          >
            <Image
              src={images[activeIndex]}
              alt={`${name} - View ${activeIndex + 1}`}
              fill
              style={{ objectFit: 'contain' }}
            />
            <button
              className={styles.closeZoom}
              onClick={() => setIsZoomed(false)}
              aria-label="Close enlarged image"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
