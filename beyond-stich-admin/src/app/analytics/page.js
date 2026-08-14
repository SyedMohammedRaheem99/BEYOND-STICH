'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../page.module.css';

const SEGMENT_COLORS = {
  GYM: '#F5C518', COFFEE: '#D4793E', GAMER: '#00FF94', MUSIC: '#9B5DE5',
  CARS: '#EF5350', BIKE: '#FF6B35', SUMMER: '#06B6D4', FLORAL: '#EC4899',
  SPORTS: '#3B82F6', VALENTINE: '#EF4444', MILLIONAIRE: '#D4AF37',
  TYPOGRAPHY: '#F8F8F8', RANDOMS: '#94A3B8',
};

const STATUS_COLORS = {
  placed: '#F5C518', confirmed: '#3B82F6', shipped: '#06B6D4',
  out_for_delivery: '#7C3AED', delivered: '#22C55E',
  cancelled: '#EF4444', returned: '#94A3B8',
};

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.overview}><p style={{ padding: '40px', color: '#666' }}>Loading analytics...</p></div>;

  const kpi = data?.kpi || {};
  const dailyRevenue = data?.dailyRevenue || [];
  const topProducts = data?.topProducts || [];
  const segmentBreakdown = data?.segmentBreakdown || [];
  const statusCounts = data?.statusCounts || [];

  const maxDailyRevenue = dailyRevenue.length > 0 ? Math.max(...dailyRevenue.map(d => d.revenue)) : 1;
  const maxProductUnits = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.units)) : 1;
  const maxSegRevenue = segmentBreakdown.length > 0 ? Math.max(...segmentBreakdown.map(s => s.revenue)) : 1;
  const totalStatusOrders = statusCounts.reduce((sum, s) => sum + s.count, 0) || 1;

  const periodLabel = period === '7d' ? '7 Days' : period === '90d' ? '90 Days' : '30 Days';

  return (
    <div className={styles.overview}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            ANALYTICS
          </motion.h1>
          <p>Performance metrics over the last {periodLabel.toLowerCase()}.</p>
        </div>
        <div style={periodSelectorStyle}>
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                ...periodBtnStyle,
                ...(period === p ? periodBtnActiveStyle : {}),
              }}
            >
              {p === '7d' ? '7D' : p === '30d' ? '30D' : '90D'}
            </button>
          ))}
        </div>
      </header>

      {/* KPI Cards */}
      <div className={styles.metricsGrid}>
        <motion.div className={styles.metricCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3>TOTAL REVENUE</h3>
          <div className={styles.value}>₹{(kpi.totalRevenue || 0).toLocaleString('en-IN')}</div>
          <p className={styles.neutral}>Last {periodLabel.toLowerCase()}</p>
        </motion.div>

        <motion.div className={styles.metricCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3>TOTAL ORDERS</h3>
          <div className={styles.value}>{kpi.totalOrders || 0}</div>
          <p className={styles.neutral}>Avg ₹{(kpi.avgOrderValue || 0).toLocaleString('en-IN')} per order</p>
        </motion.div>

        <motion.div className={styles.metricCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3>CATALOG SIZE</h3>
          <div className={styles.value}>{kpi.totalProducts || 0}</div>
          <p className={styles.neutral}>{kpi.pendingReviews || 0} reviews pending</p>
        </motion.div>
      </div>

      {/* Revenue Trend Chart */}
      <div className={styles.chartSection}>
        <h3>REVENUE TREND</h3>
        {dailyRevenue.length > 0 ? (
          <div style={chartContainerStyle}>
            <div style={revenueChartStyle}>
              {dailyRevenue.map((day, i) => (
                <div key={day._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                    <motion.div
                      style={{
                        width: '100%',
                        maxWidth: '24px',
                        background: 'linear-gradient(180deg, #22C55E, #16A34A)',
                        borderRadius: '3px 3px 0 0',
                        minHeight: '2px',
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.revenue / maxDailyRevenue) * 160}px` }}
                      transition={{ duration: 0.6, delay: i * 0.03 }}
                      title={`₹${day.revenue.toLocaleString('en-IN')} • ${day.orders} orders`}
                    />
                  </div>
                  {dailyRevenue.length <= 14 && (
                    <span style={{ fontSize: '9px', color: '#666', marginTop: '4px', whiteSpace: 'nowrap' }}>
                      {day._id.slice(5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: '#666' }}>
              <span>{dailyRevenue[0]?._id?.slice(5)}</span>
              <span>{dailyRevenue[dailyRevenue.length - 1]?._id?.slice(5)}</span>
            </div>
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>No revenue data for this period</p>
        )}
      </div>

      {/* Two Column: Top Products + Segment Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Top Products */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>TOP PRODUCTS</h3>
          {topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topProducts.map((product, i) => (
                <div key={product._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#666', fontSize: '11px', fontWeight: 700, width: '18px', textAlign: 'right' }}>
                    {i + 1}.
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#F5F5F5', fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
                        {product._id}
                      </span>
                      <span style={{ fontSize: '11px', color: '#888' }}>{product.units} sold</span>
                    </div>
                    <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div
                        style={{
                          height: '100%',
                          background: SEGMENT_COLORS[product.segment] || '#94A3B8',
                          borderRadius: '2px',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(product.units / maxProductUnits) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>No product data</p>
          )}
        </div>

        {/* Segment Breakdown */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>SEGMENT PERFORMANCE</h3>
          {segmentBreakdown.length > 0 ? (
            <div className={styles.barGraph}>
              {segmentBreakdown.map(segment => (
                <div key={segment._id || 'unknown'} className={styles.barWrap}>
                  <div className={styles.barTrack}>
                    <motion.div
                      className={styles.barFill}
                      style={{ backgroundColor: SEGMENT_COLORS[segment._id] || '#94A3B8' }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(segment.revenue / maxSegRevenue) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  <span className={styles.barLabel}>{segment._id || 'N/A'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>No segment data</p>
          )}
        </div>
      </div>

      {/* Order Status Distribution */}
      <div style={{ ...sectionStyle, marginTop: '24px' }}>
        <h3 style={sectionTitleStyle}>ORDER STATUS DISTRIBUTION</h3>
        {statusCounts.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', height: '40px', borderRadius: '6px', overflow: 'hidden' }}>
            {statusCounts.map(s => (
              <motion.div
                key={s._id}
                style={{
                  background: STATUS_COLORS[s._id] || '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  cursor: 'default',
                }}
                initial={{ flex: 0 }}
                animate={{ flex: s.count / totalStatusOrders }}
                transition={{ duration: 0.8 }}
                title={`${s._id}: ${s.count} orders`}
              >
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#0A0A0A', letterSpacing: '0.05em', whiteSpace: 'nowrap', padding: '0 6px' }}>
                  {s._id?.toUpperCase().replace(/_/g, ' ')} ({s.count})
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>No orders in this period</p>
        )}
      </div>
    </div>
  );
}

const periodSelectorStyle = {
  display: 'flex',
  gap: '4px',
  background: '#151515',
  border: '1px solid #333',
  borderRadius: '6px',
  padding: '3px',
};

const periodBtnStyle = {
  padding: '6px 14px',
  border: 'none',
  borderRadius: '4px',
  background: 'transparent',
  color: '#888',
  fontFamily: 'var(--font-display)',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const periodBtnActiveStyle = {
  background: '#F8F8F8',
  color: '#0A0A0A',
};

const sectionStyle = {
  background: '#0A0A0A',
  border: '1px solid #222',
  borderRadius: '8px',
  padding: '24px',
};

const sectionTitleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: '#666',
  marginBottom: '20px',
};

const chartContainerStyle = {
  padding: '8px 0',
};

const revenueChartStyle = {
  display: 'flex',
  gap: '2px',
  alignItems: 'flex-end',
};
