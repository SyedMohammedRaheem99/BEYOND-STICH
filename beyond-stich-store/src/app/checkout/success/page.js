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
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    // Load the order recorded at checkout so we can show real details.
    try {
      const raw = sessionStorage.getItem('bs_last_order');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.id === orderId) setOrder(parsed);
      }
    } catch {}

    // Clear cart upon successful order load.
    // We use a state flag to avoid double-clears in React Strict Mode dev
    if (!hasCleared) {
      clearCart();
      setHasCleared(true);
    }
  }, [orderId, router, clearCart, hasCleared]);

  if (!orderId) return null;

  const itemCount = order?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const deliveryEstimate = (() => {
    const base = order?.placedAt ? new Date(order.placedAt) : new Date();
    const early = new Date(base);
    const late = new Date(base);
    early.setDate(early.getDate() + 3);
    late.setDate(late.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${fmt(early)} – ${fmt(late)}`;
  })();

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

        {order && (
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>ITEMS</span>
              <span className={styles.detailValue}>{itemCount}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{order.paymentMethod === 'cod' ? 'TOTAL (COD)' : 'TOTAL PAID'}</span>
              <span className={styles.detailValue}>₹{order.total}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>EST. DELIVERY</span>
              <span className={styles.detailValue}>{deliveryEstimate}</span>
            </div>
          </div>
        )}

        {order?.paymentMethod === 'cod' && (
          <p className={styles.codNote}>
            This is a Cash on Delivery order. Please keep ₹{order.total} ready at the time of delivery.
          </p>
        )}

        {/* Email delivery is only configured when RESEND_API_KEY is set, so
            never promise a confirmation that may not arrive — the order number
            above is the customer's proof of purchase. */}
        <p className={styles.emailNote}>
          Save your order number <strong>{orderId}</strong> — you&apos;ll need it to track
          this order.
          {order?.address?.email
            ? ` If email confirmations are enabled, a copy goes to ${order.address.email}.`
            : ''}
        </p>

        <div className={styles.actions}>
          <Link href={`/track?order=${orderId}`} className={styles.secondaryBtn}>
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
