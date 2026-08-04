'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import styles from './ReviewSection.module.css';

function timeAgo(date) {
  const d = new Date(date);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function ReviewSection({
  productSlug,
  accentColor = '#F8F8F8',
  reviews = [],
  average = 0,
  count = 0,
  distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  onSubmitted,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ rating: 0, authorName: '', authorEmail: '', title: '', body: '' });
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.rating) { setMsg({ ok: false, text: 'Please pick a star rating' }); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: productSlug, ...form }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ ok: true, text: 'Thanks! Your review is live.' });
        setForm({ rating: 0, authorName: '', authorEmail: '', title: '', body: '' });
        setFormOpen(false);
        onSubmitted?.();
      } else {
        setMsg({ ok: false, text: data.error || 'Could not submit review' });
      }
    } catch {
      setMsg({ ok: false, text: 'Network error — please try again' });
    } finally {
      setSubmitting(false);
    }
  };

  const rounded = Math.round(average);

  return (
    <div className={styles.section} ref={ref}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>CUSTOMER REVIEWS</h2>
          {count > 0 ? (
            <div className={styles.summary}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="20" height="20" viewBox="0 0 24 24" fill={s <= rounded ? accentColor : 'none'} stroke={accentColor} strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className={styles.average}>{average} out of 5</span>
              <span className={styles.count}>({count} {count === 1 ? 'review' : 'reviews'})</span>
            </div>
          ) : (
            <p className={styles.count}>No reviews yet — be the first to review this drop.</p>
          )}
        </div>

        <button
          className={styles.writeRateBtn}
          style={{ borderColor: accentColor, color: accentColor }}
          onClick={() => { setFormOpen((v) => !v); setMsg(null); }}
        >
          {formOpen ? 'CANCEL' : 'WRITE A REVIEW'}
        </button>
      </div>

      {/* Rating distribution */}
      {count > 0 && (
        <div className={styles.distribution}>
          {[5, 4, 3, 2, 1].map((star) => {
            const n = distribution[star] || 0;
            const pct = count ? (n / count) * 100 : 0;
            return (
              <div key={star} className={styles.distRow}>
                <span className={styles.distLabel}>{star}★</span>
                <div className={styles.distBar}>
                  <div className={styles.distFill} style={{ width: `${pct}%`, background: accentColor }} />
                </div>
                <span className={styles.distNum}>{n}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Write-a-review form */}
      <AnimatePresence>
        {formOpen && (
          <motion.form
            className={styles.form}
            onSubmit={submit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.starPicker}>
              <span className={styles.formLabel}>Your rating *</span>
              <div className={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={styles.starBtn}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => set('rating', s)}
                    aria-label={`${s} star${s > 1 ? 's' : ''}`}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill={s <= (hover || form.rating) ? accentColor : 'none'} stroke={accentColor} strokeWidth="1.6">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formRow}>
              <input className={styles.input} placeholder="Your name *" value={form.authorName} onChange={(e) => set('authorName', e.target.value)} maxLength={60} required />
              <input className={styles.input} type="email" placeholder="Email (optional, not shown)" value={form.authorEmail} onChange={(e) => set('authorEmail', e.target.value)} />
            </div>
            <input className={styles.input} placeholder="Review title *" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={100} required />
            <textarea className={styles.textarea} placeholder="How's the fit, fabric, print? *" value={form.body} onChange={(e) => set('body', e.target.value)} maxLength={1000} required />

            {msg && <p className={`${styles.msg} ${msg.ok ? styles.msgOk : styles.msgErr}`}>{msg.text}</p>}

            <button type="submit" className={styles.submitBtn} disabled={submitting} style={{ background: accentColor }}>
              {submitting ? 'SUBMITTING…' : 'SUBMIT REVIEW'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {msg && !formOpen && <p className={`${styles.msg} ${msg.ok ? styles.msgOk : styles.msgErr}`}>{msg.text}</p>}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className={styles.grid}>
          {reviews.map((review, i) => (
            <motion.div
              key={review._id || i}
              className={styles.reviewCard}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.08 }}
            >
              <div className={styles.reviewHeader}>
                <div className={styles.reviewerInfo}>
                  <span className={styles.author}>{review.authorName}</span>
                  {review.verified && (
                    <span className={styles.verified}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      Verified Buyer
                    </span>
                  )}
                </div>
                <span className={styles.date}>{timeAgo(review.createdAt)}</span>
              </div>

              <div className={styles.reviewStars}>
                {[...Array(5)].map((_, idx) => (
                  <svg key={idx} width="14" height="14" viewBox="0 0 24 24" fill={idx < review.rating ? accentColor : 'none'} stroke={accentColor} strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <h4 className={styles.reviewTitle}>{review.title}</h4>
              <p className={styles.reviewBody}>{review.body}</p>

              {review.images?.[0] && (
                <div className={styles.reviewImageWrap}>
                  <Image src={review.images[0]} alt={`Review by ${review.authorName}`} fill style={{ objectFit: 'cover' }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
