'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './page.module.css';

const FLOW = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TrackContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { found, order } | { found:false }
  const [error, setError] = useState('');

  useEffect(() => {
    const o = searchParams.get('order');
    if (o) setOrderNumber(o);
  }, [searchParams]);

  // A signed-in customer already proved who they are, so don't make them
  // retype the email they checked out with — especially arriving from the
  // "TRACK YOUR ORDER" link in their confirmation email.
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      setContact((c) => c || session.user.email);
    }
  }, [status, session]);

  const track = async (e) => {
    e?.preventDefault();
    setError('');
    setResult(null);
    if (!orderNumber.trim() || !contact.trim()) {
      setError('Enter your order number and the email or phone used at checkout.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, contact }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Something went wrong.');
      else setResult(data);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const order = result?.found ? result.order : null;
  const cancelled = order && (order.orderStatus === 'cancelled' || order.orderStatus === 'returned');
  const currentIndex = order ? FLOW.findIndex((f) => f.key === order.orderStatus) : -1;
  const deliveryEta = order ? (() => {
    const d = new Date(order.createdAt);
    d.setDate(d.getDate() + 6);
    return fmtDate(d);
  })() : '';

  return (
    <div className={styles.page}>
      <header className={`${styles.hero} noise-overlay`}>
        <div className="container">
          <p className={styles.eyebrow}>ORDER TRACKING</p>
          <motion.h1 className={styles.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            TRACK YOUR ORDER
          </motion.h1>
          <p className={styles.intro}>Enter your order number and the email or phone you used at checkout.</p>
        </div>
      </header>

      <div className={`${styles.body} container`}>
        <form className={styles.form} onSubmit={track}>
          <input
            className={styles.input}
            placeholder="Order number (e.g. BS-XXXX-XXXX)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            aria-label="Order number"
          />
          <input
            className={styles.input}
            placeholder="Email or phone"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            aria-label="Email or phone"
          />
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'TRACKING…' : 'TRACK ORDER'}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        {result && !result.found && (
          <p className={styles.error}>{result.message || "We couldn't find that order. Double-check the number and contact."}</p>
        )}

        {order && (
          <motion.div className={styles.result} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={styles.resultHead}>
              <div>
                <span className={styles.label}>ORDER</span>
                <span className={styles.orderNo}>{order.orderNumber}</span>
              </div>
              <span className={`${styles.statusPill} ${cancelled ? styles.pillBad : styles.pillGood}`}>
                {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            <div className={styles.metaRow}>
              <span>Placed {fmtDate(order.createdAt)}</span>
              {!cancelled && order.orderStatus !== 'delivered' && <span>Est. delivery by {deliveryEta}</span>}
              {order.trackingNumber && <span>Tracking: {order.trackingNumber}</span>}
            </div>

            {/* Timeline */}
            {cancelled ? (
              <div className={styles.cancelled}>
                This order was {order.orderStatus}. If this is unexpected, contact{' '}
                <Link href="/contact">support</Link>.
              </div>
            ) : (
              <div className={styles.timeline}>
                {FLOW.map((step, i) => {
                  const done = i <= currentIndex;
                  const active = i === currentIndex;
                  return (
                    <div key={step.key} className={`${styles.step} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}>
                      <span className={styles.dot}>{done ? '✓' : i + 1}</span>
                      <span className={styles.stepLabel}>{step.label}</span>
                      {i < FLOW.length - 1 && <span className={`${styles.connector} ${i < currentIndex ? styles.connectorDone : ''}`} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Items */}
            <div className={styles.items}>
              {order.items.map((it, i) => (
                <div key={i} className={styles.item}>
                  {it.image && it.image !== 'x' && (
                    <div className={styles.itemImg}>
                      <Image src={it.image} alt={it.name} fill sizes="56px" style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className={styles.itemMeta}>
                    <span className={styles.itemName}>{it.name}</span>
                    <span className={styles.itemSub}>Size {it.size} · {it.color} · Qty {it.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.total}>
              <span>Order total</span>
              <span>₹{order.total}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackContent />
    </Suspense>
  );
}
