'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/lib/store';
import styles from './MagneticButton.module.css';

export default function MagneticButton({
  children,
  href,
  onClick,
  variant = 'primary',
  className = '',
  ...props
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { setCursorVariant, resetCursor } = useUIStore();

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    resetCursor();
  };

  const handleMouseEnter = () => {
    setCursorVariant('hover');
  };

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      ref={ref}
      href={href}
      onClick={onClick}
      className={`${styles.button} ${styles[variant]} ${className}`}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15, mass: 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <span className={styles.label}>{children}</span>
      <span className={styles.glow} />
    </Component>
  );
}
