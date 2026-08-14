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

export default function OrderHistoryPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders?user=true');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
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
    <div className={styles.ordersPage}>
      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        MY ORDERS
      </motion.h1>
      <p>Track and manage all your purchases.</p>

      {loading ? (
        <p className={styles.emptyState}>Loading your orders...</p>
      ) : orders.length > 0 ? (
        <div className={styles.ordersList}>
          {orders.map((order, i) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <div className={styles.orderId}>{order.orderNumber}</div>
                    <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
                  </div>
                  <span
                    className={styles.statusBadge}
                    style={{ color: STATUS_COLORS[order.orderStatus] || '#888' }}
                  >
                    {order.orderStatus?.toUpperCase().replace(/_/g, ' ')}
                  </span>
                </div>

                {order.items?.length > 0 && (
                  <div className={styles.orderItems}>
                    {order.items.map((item, j) => (
                      item.image ? (
                        <img key={j} src={item.image} alt={item.name} className={styles.itemThumb} />
                      ) : (
                        <div key={j} className={styles.itemThumb} />
                      )
                    ))}
                  </div>
                )}

                <div className={styles.orderFooter}>
                  <div>
                    <span className={styles.orderTotal}>₹{order.total?.toLocaleString('en-IN')}</span>
                    <span className={styles.itemCount}> · {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                  </div>
                  <Link href={`/track?order=${order.orderNumber}`} className={styles.trackLink}>
                    TRACK ORDER
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>NO ORDERS YET</h2>
          <p>When you place an order, it will appear here.</p>
          <Link href="/shop" className={styles.shopBtn}>START SHOPPING</Link>
        </div>
      )}
    </div>
  );
}
