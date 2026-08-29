'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/lib/store';
import styles from './ProductGallery.module.css';

export default function ProductGallery({ images, name }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const swipeRef = useRef(null);

  // Sync mobile pagination dots with scroll position
  useEffect(() => {
    const container = swipeRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index);
            if (!isNaN(idx)) setMobileIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );
    container.querySelectorAll('[data-index]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [images]);
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
            {/* `priority` is deprecated in Next 16 in favour of `preload`.
                Unlike ProductCard, this genuinely is the single LCP
                candidate — the first PDP image, not one of several — so
                `preload` is the case the docs recommend it for. */}
            <Image
              src={img}
              alt={`${name} - View ${i + 1}`}
              fill
              sizes="50vw"
              preload={i === 0}
              className={`${styles.image} ${isZoomed && activeIndex === i ? styles.imageZoomed : ''}`}
            />
          </div>
        ))}
      </div>

      {/* Mobile Swipe View */}
      <div className={styles.mobileView}>
        <div ref={swipeRef} className={styles.swipeContainer}>
          {images.map((img, i) => (
            /* Tap to enlarge. Zoom was wired only to the desktop blocks, and
               .desktopView is display:none below 1024px — so on every phone
               the overlay was unreachable code. For a graphic tee, being able
               to inspect the print is the purchase decision. */
            <div
              key={i}
              data-index={i}
              className={styles.swipeItem}
              onClick={() => handleImageClick(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleImageClick(i);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Enlarge image ${i + 1} of ${images.length}`}
            >
              {/* Both gallery copies are in the DOM (one hidden by CSS).
                  Preloading here too made the browser fetch the first image
                  twice at two sizes on every PDP — a preload is issued
                  regardless of display:none. The desktop copy above carries
                  the priority for the LCP image. */}
              <Image
                src={img}
                alt={`${name} - View ${i + 1}`}
                fill
                sizes="100vw"
                loading={i === 0 ? 'eager' : 'lazy'}
                className={styles.image}
              />
            </div>
          ))}
        </div>
        
        {/* Counter pinned to the top of the frame. The dots sit at the bottom
            of a 4:5 image, which on a 360px phone is below the fold — so the
            customer saw one photo with no indication more existed. */}
        {images.length > 1 && (
          <span className={styles.counter} aria-hidden="true">
            {mobileIndex + 1} / {images.length}
          </span>
        )}

        {/* Pagination Dots */}
        <div className={styles.dots}>
          {images.map((_, i) => (
            <span 
              key={i} 
              className={`${styles.dot} ${i === mobileIndex ? styles.dotActive : ''}`}
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
