'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './page.module.css';

const STATUS_COLORS = {
  placed: '#F5C518', confirmed: '#3B82F6', shipped: '#06B6D4',
  out_for_delivery: '#7C3AED', delivered: '#22C55E',
  cancelled: '#EF4444', returned: '#94A3B8',
};

export default function AccountDashboard() {
  const { data: session } = useSession();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders?user=true&limit=3');
        if (res.ok) {
          const data = await res.json();
          setRecentOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchOrders();
    else setLoading(false);
  }, [session]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className={styles.dashboard}>
      <motion.div
        className={styles.greeting}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1>WELCOME BACK{session?.user?.name ? `, ${session.user.name.split(' ')[0].toUpperCase()}` : ''}</h1>
        <p>Manage your orders, profile, and preferences.</p>
      </motion.div>

      <div className={styles.quickLinks}>
        <Link href="/account/orders" className={styles.quickCard}>
          <span className={styles.quickIcon}>📦</span>
          <span className={styles.quickLabel}>MY ORDERS</span>
          <span className={styles.quickDesc}>Track and view order history</span>
        </Link>
        <Link href="/account/profile" className={styles.quickCard}>
          <span className={styles.quickIcon}>👤</span>
          <span className={styles.quickLabel}>PROFILE</span>
          <span className={styles.quickDesc}>Edit your details</span>
        </Link>
        <Link href="/account/addresses" className={styles.quickCard}>
          <span className={styles.quickIcon}>📍</span>
          <span className={styles.quickLabel}>ADDRESSES</span>
          <span className={styles.quickDesc}>Manage saved addresses</span>
        </Link>
        <Link href="/account/wishlist" className={styles.quickCard}>
          <span className={styles.quickIcon}>❤️</span>
          <span className={styles.quickLabel}>WISHLIST</span>
          <span className={styles.quickDesc}>Your saved items</span>
        </Link>
      </div>

      <div className={styles.recentSection}>
        <h2>RECENT ORDERS</h2>
        {loading ? (
          <p className={styles.emptyState}>Loading...</p>
        ) : recentOrders.length > 0 ? (
          <div className={styles.ordersList}>
            {recentOrders.map(order => (
              <Link key={order._id} href={`/account/orders/${order.orderNumber}`} className={styles.orderItem}>
                <div className={styles.orderInfo}>
                  <span className={styles.orderId}>{order.orderNumber}</span>
                  <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.orderTotal}>₹{order.total?.toLocaleString('en-IN')}</span>
                  <span
                    className={styles.statusBadge}
                    style={{ color: STATUS_COLORS[order.orderStatus] || '#888' }}
                  >
                    {order.orderStatus?.toUpperCase().replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>No orders yet. Start shopping to see them here!</p>
        )}
      </div>
    </div>
  );
}
