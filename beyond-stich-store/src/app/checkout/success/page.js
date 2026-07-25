'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import styles from './page.module.css';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [hasCleared, setHasCleared] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }
    
    // Clear cart upon successful order load. 
    // We use a state flag to avoid double-clears in React Strict Mode dev
    if (!hasCleared) {
      clearCart();
      setHasCleared(true);
    }
  }, [orderId, router, clearCart, hasCleared]);

  if (!orderId) return null;

  return (
    <div className={styles.successPage}>
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className={styles.checkIcon}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        
        <h1 className={styles.title}>ORDER SECURED.</h1>
        <p className={styles.subtitle}>Welcome to the club. Your order has been placed successfully.</p>
        
        <div className={styles.orderBox}>
          <span className={styles.label}>ORDER ID</span>
          <span className={styles.id}>{orderId}</span>
        </div>

        <p className={styles.emailNote}>We've sent a confirmation email with your shipping details and tracking information.</p>

        <div className={styles.actions}>
          <Link href="/account" className={styles.secondaryBtn}>
            TRACK ORDER
          </Link>
          <Link href="/shop" className={styles.primaryBtn}>
            CONTINUE SHOPPING
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div style={{height: '100vh', background: 'var(--color-bg)', display: 'grid', placeItems: 'center'}}>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
