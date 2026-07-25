'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './page.module.css';

const SEGMENT_COLORS = {
  GYM: '#F5C518', COFFEE: '#C4622D', GAMER: '#00FF94', MUSIC: '#7C3AED',
  CARS: '#E63946', BIKE: '#FF6B35', SUMMER: '#06B6D4', FLORAL: '#EC4899',
  SPORTS: '#3B82F6', VALENTINE: '#EF4444', MILLINIORE: '#D4AF37',
  TYPOGRAPHY: '#F8F8F8', RANDOMS: '#94A3B8',
};

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.overview}><p style={{padding: '40px', color: '#666'}}>Loading metrics...</p></div>;

  const revenue = data?.revenue || { today: 0, changePercent: 0 };
  const orders = data?.orders || { active: 0, pendingDispatch: 0 };
  const stock = data?.stock || { lowCount: 0, outOfStockCount: 0 };
  const segments = data?.segmentPerformance || [];
  const recent = data?.recentOrders || [];

  const maxSegRevenue = segments.length > 0 ? Math.max(...segments.map(s => s.revenue)) : 1;

  return (
    <div className={styles.overview}>
      <header className={styles.header}>
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          COMMAND CENTER
        </motion.h1>
        <p>Live metrics from the brand universe.</p>
      </header>

      <div className={styles.metricsGrid}>
        <motion.div className={styles.metricCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3>TODAY&apos;S REVENUE</h3>
          <div className={styles.value}>₹{revenue.today.toLocaleString('en-IN')}</div>
          <p className={revenue.changePercent >= 0 ? styles.positive : styles.negative}>
            {revenue.changePercent >= 0 ? '+' : ''}{revenue.changePercent}% vs yesterday
          </p>
        </motion.div>

        <motion.div className={styles.metricCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3>ACTIVE ORDERS</h3>
          <div className={styles.value}>{orders.active}</div>
          <p className={styles.neutral}>{orders.pendingDispatch} pending dispatch</p>
        </motion.div>

        <motion.div className={styles.metricCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3>LOW STOCK ALERTS</h3>
          <div className={styles.value}>{stock.lowCount + stock.outOfStockCount}</div>
          <p className={styles.negative}>{stock.outOfStockCount} out of stock</p>
        </motion.div>
      </div>

      {/* Segment Performance */}
      <div className={styles.chartSection}>
        <h3>SEGMENT PERFORMANCE (LAST 7 DAYS)</h3>
        <div className={styles.barGraph}>
          {segments.length > 0 ? segments.map(segment => (
            <div key={segment._id || 'unknown'} className={styles.barWrap}>
              <div className={styles.barTrack}>
                <motion.div
                  className={styles.barFill}
                  style={{ backgroundColor: SEGMENT_COLORS[segment._id] || '#94A3B8' }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(segment.revenue / maxSegRevenue) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className={styles.barLabel}>{segment._id || 'N/A'}</span>
            </div>
          )) : (
            <p style={{ color: '#666', width: '100%', textAlign: 'center' }}>No order data yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className={styles.recentOrders}>
        <h3>RECENT ACTIVITY</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>CUSTOMER</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {recent.length > 0 ? recent.map(order => (
              <tr key={order._id}>
                <td>{order.orderNumber}</td>
                <td>{order.customer}</td>
                <td>₹{order.total?.toLocaleString('en-IN')}</td>
                <td>
                  <span className={
                    order.status === 'delivered' ? styles.statusDelivered :
                    order.status === 'shipped' ? styles.statusShipped :
                    styles.statusProcessing
                  }>
                    {order.status?.toUpperCase()}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No orders yet. They will appear here once customers start purchasing.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
