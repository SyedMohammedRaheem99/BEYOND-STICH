'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useFocusTrap from '@/hooks/useFocusTrap';
import SizeChart from './SizeChart';
import styles from './SizeGuideModal.module.css';

/**
 * Size guide, opened from the product page.
 *
 * The chart itself lives in SizeChart so this and /size-guide render the
 * same thing — both previously carried their own hard-coded copy of a tee
 * chart, in two different shapes, and had already drifted apart.
 *
 * Measurements come from the product's type, so a pant shows waist and
 * inseam where a tee shows chest and shoulder.
 */
export default function SizeGuideModal({
  open,
  onClose,
  accentColor = 'var(--accent)',
  chart = null,
  productType = '',
  selectedSize = null,
}) {
  const closeBtnRef = useRef(null);
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={trapRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className={styles.header}>
              <h2 className={styles.title} id="size-guide-title">
                SIZE GUIDE
                {productType && <span className={styles.typeTag}>{productType}</span>}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close size guide"
                ref={closeBtnRef}
              >
                ✕
              </button>
            </div>

            <SizeChart
              columns={chart?.columns || []}
              rows={chart?.rows || []}
              note={chart?.note || ''}
              measureGuide={chart?.measureGuide || []}
              accentColor={accentColor}
              highlightSize={selectedSize}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
