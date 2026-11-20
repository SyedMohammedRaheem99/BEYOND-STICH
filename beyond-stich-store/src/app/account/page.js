'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Skeleton from '@/components/ui/Skeleton';
import { getOrderStatusColor } from '@/lib/constants';
import styles from './page.module.css';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing state from a browser/session/URL source that is unavailable during render
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
          <div className={styles.ordersList} aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow}>
                <Skeleton shape="text" width="30%" />
                <Skeleton shape="text" width="18%" />
              </div>
            ))}
          </div>
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
                    style={{ color: getOrderStatusColor(order.orderStatus) }}
                  >
                    {order.orderStatus?.toUpperCase().replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            No orders yet.{' '}
            <Link href="/shop" className={styles.emptyLink}>
              Start shopping
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
