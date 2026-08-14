'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useFocusTrap from '@/hooks/useFocusTrap';
import styles from './SizeGuideModal.module.css';

// Measurements in inches for the oversized fit (garment, laid flat = half-chest x2).
const SIZE_CHART = [
  { size: 'S', chest: 42, length: 27, shoulder: 21 },
  { size: 'M', chest: 44, length: 28, shoulder: 22 },
  { size: 'L', chest: 46, length: 29, shoulder: 23 },
  { size: 'XL', chest: 48, length: 30, shoulder: 24 },
  { size: 'XXL', chest: 50, length: 31, shoulder: 25 },
];

export default function SizeGuideModal({ open, onClose, accentColor = '#F8F8F8' }) {
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
              <h2 className={styles.title} id="size-guide-title">SIZE GUIDE</h2>
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close size guide"
                ref={closeBtnRef}
              >
                ✕
              </button>
            </div>

            <p className={styles.subtitle}>
              All measurements are in inches. Our tees are cut for an{' '}
              <strong>oversized fit</strong> — size down for a more regular look.
            </p>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    <th scope="col">Chest</th>
                    <th scope="col">Length</th>
                    <th scope="col">Shoulder</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map((row) => (
                    <tr key={row.size}>
                      <th scope="row" style={{ color: accentColor }}>{row.size}</th>
                      <td>{row.chest}"</td>
                      <td>{row.length}"</td>
                      <td>{row.shoulder}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.tips}>
              <h3 className={styles.tipsTitle}>HOW TO MEASURE</h3>
              <ul className={styles.tipsList}>
                <li><strong>Chest:</strong> measure across the fullest part, armpit to armpit, and double it.</li>
                <li><strong>Length:</strong> from the highest point of the shoulder straight down to the hem.</li>
                <li><strong>Shoulder:</strong> from one shoulder seam across to the other.</li>
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
