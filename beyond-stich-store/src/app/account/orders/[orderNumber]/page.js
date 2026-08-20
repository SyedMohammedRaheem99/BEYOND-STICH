'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from './page.module.css';

const STATUS_STEPS = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];

const STATUS_LABEL = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const RETURN_LABEL = {
  requested: 'Return requested — we’ll be in touch within 24 hours.',
  approved: 'Return approved. Keep the item packed and ready for pickup.',
  rejected: 'Return request declined. Contact us if you need help.',
  completed: 'Return completed.',
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrderDetailPage(props) {
  const params = use(props.params);
  const { orderNumber } = params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Return request
  const [showReturn, setShowReturn] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [returnMsg, setReturnMsg] = useState('');
  const [returnErr, setReturnErr] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load that order');
        setOrder(data.order);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const submitReturn = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setReturnMsg('');

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();

      setReturnErr(!res.ok);
      setReturnMsg(data.error || data.message);
      if (res.ok) {
        setOrder((o) => ({ ...o, returnRequest: data.returnRequest }));
        setShowReturn(false);
      }
    } catch {
      setReturnErr(true);
      setReturnMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.page}><p className={styles.muted}>Loading your order…</p></div>;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>{error}</p>
        <Link href="/account/orders" className={styles.backLink}>← Back to orders</Link>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';
  const returnStatus = order.returnRequest?.status || 'none';
  const canRequestReturn = order.orderStatus === 'delivered' && returnStatus === 'none';

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href="/account/orders" className={styles.backLink}>← Back to orders</Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.orderNumber}>{order.orderNumber}</h1>
          <p className={styles.muted}>Placed on {formatDate(order.createdAt)}</p>
        </div>
        <span className={`${styles.statusBadge} ${isCancelled ? styles.statusCancelled : ''}`}>
          {STATUS_LABEL[order.orderStatus] || order.orderStatus}
        </span>
      </header>

      {/* Progress — hidden for cancelled orders, where it makes no sense */}
      {!isCancelled && (
        <ol className={styles.progress}>
          {STATUS_STEPS.map((step, i) => (
            <li
              key={step}
              className={`${styles.progressStep} ${i <= currentStep ? styles.progressDone : ''}`}
            >
              <span className={styles.progressDot} aria-hidden="true" />
              <span className={styles.progressLabel}>{STATUS_LABEL[step]}</span>
            </li>
          ))}
        </ol>
      )}

      {order.trackingNumber && (
        <p className={styles.tracking}>
          Tracking number: <strong>{order.trackingNumber}</strong>
        </p>
      )}

      {returnStatus !== 'none' && (
        <p className={styles.returnNotice}>{RETURN_LABEL[returnStatus]}</p>
      )}

      {/* Items — the list page showed bare thumbnails with no names or prices */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ITEMS</h2>
        <ul className={styles.items}>
          {(order.items || []).map((item, i) => (
            <li key={i} className={styles.item}>
              <div className={styles.itemImage}>
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="72px" />
                ) : null}
              </div>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemMeta}>
                  Size {item.size}
                  {item.color ? ` · ${item.color}` : ''} · Qty {item.quantity}
                </span>
              </div>
              <span className={styles.itemPrice}>
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>PAYMENT</h2>
        <dl className={styles.summary}>
          <div><dt>Subtotal</dt><dd>₹{order.subtotal?.toLocaleString('en-IN')}</dd></div>
          {order.discount > 0 && (
            <div>
              <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
              <dd className={styles.discount}>−₹{order.discount.toLocaleString('en-IN')}</dd>
            </div>
          )}
          <div>
            <dt>Shipping</dt>
            <dd>{order.shipping > 0 ? `₹${order.shipping}` : 'FREE'}</dd>
          </div>
          <div className={styles.totalRow}>
            <dt>Total</dt>
            <dd>₹{order.total?.toLocaleString('en-IN')}</dd>
          </div>
        </dl>
        <p className={styles.muted}>
          {order.paymentMethod === 'cod'
            ? `Cash on delivery${order.paymentStatus === 'paid' ? ' · collected' : ' · pay when it arrives'}`
            : `Paid online${order.paymentStatus === 'paid' ? '' : ' · payment pending'}`}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>DELIVERY ADDRESS</h2>
        <address className={styles.address}>
          {order.shippingAddress?.fullName}<br />
          {order.shippingAddress?.street}<br />
          {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}<br />
          {order.shippingAddress?.phone}
        </address>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>NEED HELP?</h2>

        {canRequestReturn && !showReturn && (
          <button className={styles.secondaryBtn} onClick={() => setShowReturn(true)}>
            REQUEST A RETURN
          </button>
        )}

        {showReturn && (
          <form className={styles.returnForm} onSubmit={submitReturn}>
            <label className={styles.label} htmlFor="reason">
              What went wrong? We read every one of these.
            </label>
            <textarea
              id="reason"
              className={styles.textarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The size runs smaller than the guide suggested"
              rows={4}
              maxLength={500}
              required
            />
            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                {submitting ? 'SENDING…' : 'SUBMIT REQUEST'}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowReturn(false)}
              >
                CANCEL
              </button>
            </div>
          </form>
        )}

        {returnMsg && (
          <p className={returnErr ? styles.errorMsg : styles.successMsg} role="alert">
            {returnMsg}
          </p>
        )}

        {/* Order cancellation is handled over WhatsApp for now — deliberately,
            so it can be checked against dispatch before anything is promised. */}
        <p className={styles.helpLine}>
          Need to change or cancel this order?{' '}
          <a
            href={`https://wa.me/918310273670?text=${encodeURIComponent(
              `Hi Beyond Stich, I need help with order ${order.orderNumber}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message us on WhatsApp
          </a>{' '}
          and we’ll sort it out.
        </p>
      </section>
    </motion.div>
  );
}
