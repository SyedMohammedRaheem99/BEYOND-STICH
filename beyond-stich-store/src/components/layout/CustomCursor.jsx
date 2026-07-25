'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useUIStore } from '@/lib/store';
import styles from './CustomCursor.module.css';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const { cursorVariant, cursorText } = useUIStore();

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only show custom cursor on non-touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

  // Hide on touch devices
  if (typeof window !== 'undefined') {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return null;
  }

  const variants = {
    default: {
      width: 16,
      height: 16,
      backgroundColor: 'transparent',
      border: '1.5px solid rgba(248, 248, 248, 0.6)',
      mixBlendMode: 'difference',
    },
    hover: {
      width: 60,
      height: 60,
      backgroundColor: 'rgba(248, 248, 248, 0.08)',
      border: '1.5px solid rgba(248, 248, 248, 0.4)',
      mixBlendMode: 'difference',
    },
    text: {
      width: 100,
      height: 100,
      backgroundColor: 'rgba(248, 248, 248, 0.95)',
      border: 'none',
      mixBlendMode: 'difference',
    },
    hidden: {
      width: 0,
      height: 0,
      opacity: 0,
    },
  };

  return (
    <motion.div
      ref={cursorRef}
      className={styles.cursor}
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
      }}
      animate={cursorVariant}
      variants={variants}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
    >
      {cursorText && (
        <span className={styles.cursorText}>{cursorText}</span>
      )}
    </motion.div>
  );
}
