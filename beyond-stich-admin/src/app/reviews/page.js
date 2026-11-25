'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../products/page.module.css';
import LoadState from '@/components/LoadState';
import fetchJson from '@/lib/fetchJson';

const RATING_STARS = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

const EMPTY_REVIEW = {
  productSlug: '',
  authorName: '',
  authorEmail: '',
  rating: 5,
  title: '',
  body: '',
  images: [],
  verified: false,
  approved: true,
};

const MAX_REVIEW_IMAGES = 5;

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [editing, setEditing] = useState(null); // review object, or 'new'
  const [form, setForm] = useState(EMPTY_REVIEW);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);

  // Declared before the effect that calls it and memoised on the deps it
  // reads. It was defined *after* the effect, so the effect captured the
  // instance that existed at mount and a later dependency change re-ran a
  // stale closure holding the previous filter value.
    const fetchReviews = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      // fetchJson throws on a non-2xx, so an outage can no longer
      // arrive here looking like an empty list.
      const data = await fetchJson(`/api/reviews?${params}`);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setLoadError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Products for the slug picker. A review must attach to a real product,
  // so this is a dropdown rather than a free-text slug anyone can mistype.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchJson('/api/products');
        if (!cancelled) setProducts(data.products || []);
      } catch {
        // The page's own error state covers real outages.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Awaited inside an async IIFE so the first state update lands in a
    // callback rather than synchronously in the effect body, which React
    // flags as a cascading render.
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchReviews();
    })();
    return () => { cancelled = true; };
  }, [fetchReviews]);



  const handleSearch = () => fetchReviews();

  const updateReview = async (reviewId, update) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r => (r._id === reviewId ? data.review : r)));
        if (selectedReview?._id === reviewId) {
          setSelectedReview(data.review);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update');
      }
    } catch {
      alert('Network error');
    }
  };

  const deleteReview = async (reviewId) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r._id !== reviewId));
        if (selectedReview?._id === reviewId) setSelectedReview(null);
      } else {
        alert('Failed to delete');
      }
    } catch {
      alert('Network error');
    }
  };

  const getReviewStatus = (review) => {
    if (!review.approved) return 'rejected';
    if (review.verified) return 'approved';
    return 'pending';
  };

  const STATUS_COLORS = {
    pending: { border: '#F5C518', color: '#F5C518' },
    approved: { border: '#22C55E', color: '#22C55E' },
    rejected: { border: '#EF4444', color: '#EF4444' },
  };

  const filteredReviews = reviews.filter(r =>
    r.productSlug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const pendingCount = reviews.filter(r => r.approved && !r.verified).length;

  const openNew = () => { setForm(EMPTY_REVIEW); setEditing('new'); };

  const openEdit = (r) => {
    setForm({
      productSlug: r.productSlug || '',
      authorName: r.authorName || '',
      authorEmail: r.authorEmail || '',
      rating: r.rating || 5,
      title: r.title || '',
      body: r.body || '',
      images: r.images || [],
      verified: r.verified === true,
      approved: r.approved !== false,
    });
    setEditing(r);
  };

  const uploadImage = async (file) => {
    if (!file) return;
    if (form.images.length >= MAX_REVIEW_IMAGES) {
      alert(`A review can carry at most ${MAX_REVIEW_IMAGES} photos.`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      // Review photos are customer-shot and portrait more often than not,
      // so they use the product preset rather than the wide banner one.
      fd.append('purpose', 'product');
      const data = await fetchJson('/api/upload', { method: 'POST', body: fd });
      setForm((f) => ({ ...f, images: [...f.images, data.url] }));
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveReview = async () => {
    setSaving(true);
    try {
      const isNew = editing === 'new';
      await fetchJson(isNew ? '/api/reviews' : `/api/reviews/${editing._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setEditing(null);
      fetchReviews();
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1>REVIEWS</h1>
          <p>Add, edit and moderate reviews.{pendingCount > 0 && ` ${pendingCount} pending review${pendingCount > 1 ? 's' : ''}.`}</p>
        </div>
        <button className={styles.addBtn} onClick={openNew}>+ ADD REVIEW</button>
      </header>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search product, author, or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading || loadError || reviews.length === 0 ? (
        <LoadState
          loading={loading}
          error={loadError}
          onRetry={fetchReviews}
          empty={reviews.length === 0}
          loadingText="Loading reviews…"
          emptyText="No reviews yet."
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>AUTHOR</th>
                <th>RATING</th>
                <th>TITLE</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length > 0 ? filteredReviews.map(review => {
                const status = getReviewStatus(review);
                const sc = STATUS_COLORS[status];

                return (
                  <tr key={review._id}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                      {review.productSlug}
                    </td>
                    <td>
                      <div>
                        <span style={{ color: 'var(--color-text-primary)' }}>{review.authorName}</span>
                        {review.authorEmail && (
                          <p style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>{review.authorEmail}</p>
                        )}
                      </div>
                    </td>
                    <td style={{ color: '#F5C518', letterSpacing: '2px', fontSize: '12px' }}>
                      {RATING_STARS(review.rating)}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {review.title}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(review.createdAt)}
                    </td>
                    <td>
                      <span className={styles.segmentBadge} style={{ borderColor: sc.border, color: sc.color }}>
                        {status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => setSelectedReview(review)}>VIEW</button>
                        <button className={styles.editBtn} onClick={() => openEdit(review)}>EDIT</button>
                        {status === 'pending' && (
                          <>
                            <button className={styles.editBtn} style={{ color: '#22C55E' }} onClick={() => updateReview(review._id, { approved: true, verified: true })}>
                              APPROVE
                            </button>
                            <button className={styles.deleteBtn} onClick={() => updateReview(review._id, { approved: false })}>
                              REJECT
                            </button>
                          </>
                        )}
                        {status === 'rejected' && (
                          <button className={styles.editBtn} style={{ color: '#22C55E' }} onClick={() => updateReview(review._id, { approved: true, verified: true })}>
                            APPROVE
                          </button>
                        )}
                        {status === 'approved' && (
                          <button className={styles.deleteBtn} onClick={() => updateReview(review._id, { approved: false })}>
                            REJECT
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  No reviews found. Reviews will appear here when customers submit them.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / edit review */}
      {editing && (
        <div style={modalStyles.overlay} onClick={() => !saving && setEditing(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '0.05em' }}>
                {editing === 'new' ? 'ADD REVIEW' : 'EDIT REVIEW'}
              </h2>
              <button onClick={() => setEditing(null)} style={modalStyles.closeBtn}>&#10005;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <RField label="Product" hint="A review must attach to a real product, so this is a list rather than free text.">
                <select style={rInput} value={form.productSlug}
                  onChange={(e) => setForm((f) => ({ ...f, productSlug: e.target.value }))}>
                  <option value="">Choose a product...</option>
                  {products.map((p) => (
                    <option key={p._id} value={p.slug}>{p.name}</option>
                  ))}
                </select>
              </RField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <RField label="Reviewer name">
                  <input style={rInput} value={form.authorName}
                    onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))} />
                </RField>
                <RField label="Email (optional)" hint="Never shown publicly.">
                  <input style={rInput} value={form.authorEmail}
                    onChange={(e) => setForm((f) => ({ ...f, authorEmail: e.target.value }))} />
                </RField>
              </div>

              <RField label="Rating">
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: n }))}
                      style={{
                        minHeight: '44px', minWidth: '44px', fontSize: '20px', cursor: 'pointer',
                        background: 'transparent', border: '1px solid #333', borderRadius: '6px',
                        color: n <= form.rating ? '#F5C518' : '#444',
                      }}
                      aria-label={`${n} star`}
                    >&#9733;</button>
                  ))}
                </div>
              </RField>

              <RField label="Title">
                <input style={rInput} value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </RField>

              <RField label="Review">
                <textarea style={{ ...rInput, minHeight: '120px', resize: 'vertical' }} value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
              </RField>

              <RField label={`Photos (${form.images.length}/${MAX_REVIEW_IMAGES})`}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {form.images.map((url) => (
                    <div key={url} style={{ position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" style={{ width: '72px', height: '90px', objectFit: 'cover', borderRadius: '6px', background: '#000' }} />
                      <button
                        onClick={() => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))}
                        style={{
                          position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px',
                          borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none',
                          cursor: 'pointer', fontSize: '13px', lineHeight: 1,
                        }}
                        aria-label="Remove photo"
                      >&#10005;</button>
                    </div>
                  ))}
                  {form.images.length < MAX_REVIEW_IMAGES && (
                    <label style={{
                      minHeight: '44px', display: 'inline-flex', alignItems: 'center', padding: '10px 16px',
                      background: '#0F0F0F', border: '1px dashed #444', borderRadius: '6px',
                      color: uploading ? '#666' : '#F5F5F5', fontSize: '12px',
                      cursor: uploading ? 'default' : 'pointer',
                    }}>
                      {uploading ? 'UPLOADING...' : '+ ADD PHOTO'}
                      <input type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }}
                        onChange={(e) => { uploadImage(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                  )}
                </div>
              </RField>

              <label style={rCheck}>
                <input type="checkbox" checked={form.approved}
                  onChange={(e) => setForm((f) => ({ ...f, approved: e.target.checked }))} />
                Approved &mdash; visible on the product page
              </label>

              <label style={rCheck}>
                <input type="checkbox" checked={form.verified}
                  onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))} />
                Verified buyer &mdash; shows the badge
              </label>

              <button onClick={saveReview} disabled={saving || uploading} style={{
                minHeight: '44px', padding: '12px',
                background: saving || uploading ? '#555' : '#22C55E',
                color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 800,
                fontSize: '13px', letterSpacing: '0.08em',
                cursor: saving || uploading ? 'default' : 'pointer',
              }}>
                {saving ? 'SAVING...' : uploading ? 'WAIT FOR UPLOAD...' : 'SAVE REVIEW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div style={modalStyles.overlay} onClick={() => setSelectedReview(null)}>
          <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '0.05em' }}>REVIEW DETAILS</h2>
              <button onClick={() => setSelectedReview(null)} style={modalStyles.closeBtn}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.08em' }}>PRODUCT</h4>
                <p style={{ color: '#F5F5F5', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{selectedReview.productSlug}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.08em' }}>AUTHOR</h4>
                <p style={{ color: '#F5F5F5' }}>{selectedReview.authorName}</p>
                <p style={{ color: '#888', fontSize: '12px' }}>{selectedReview.authorEmail || '—'}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.08em' }}>RATING</h4>
                <p style={{ color: '#F5C518', fontSize: '16px', letterSpacing: '3px' }}>{RATING_STARS(selectedReview.rating)}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.08em' }}>DATE</h4>
                <p style={{ color: '#F5F5F5' }}>{formatDate(selectedReview.createdAt)}</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.08em' }}>TITLE</h4>
              <p style={{ color: '#F5F5F5', fontWeight: 700, fontSize: '15px' }}>{selectedReview.title}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.08em' }}>REVIEW</h4>
              <p style={{ color: '#CCC', lineHeight: 1.6, fontSize: '14px' }}>{selectedReview.body}</p>
            </div>

            {selectedReview.images?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '8px', letterSpacing: '0.08em' }}>IMAGES</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedReview.images.map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid #333', paddingTop: '20px' }}>
              {(() => {
                const status = getReviewStatus(selectedReview);
                return (
                  <>
                    {status !== 'approved' && (
                      <button
                        onClick={() => updateReview(selectedReview._id, { approved: true, verified: true })}
                        style={{ ...actionBtnStyle, background: '#22C55E', color: '#0A0A0A' }}
                      >
                        APPROVE
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button
                        onClick={() => updateReview(selectedReview._id, { approved: false })}
                        style={{ ...actionBtnStyle, background: '#EF4444', color: '#FFF' }}
                      >
                        REJECT
                      </button>
                    )}
                    <button
                      onClick={() => deleteReview(selectedReview._id)}
                      style={{ ...actionBtnStyle, background: 'transparent', color: '#888', border: '1px solid #333' }}
                    >
                      DELETE
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '12px',
  letterSpacing: '0.08em',
  cursor: 'pointer',
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px', overflowY: 'auto' },
  modal: { background: '#111', border: '1px solid #333', borderRadius: '8px', width: '100%', maxWidth: '600px', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
};

function RField({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: '#888', fontSize: '11px', letterSpacing: '0.06em' }}>{label}</label>
      {children}
      {hint && <span style={{ color: '#666', fontSize: '11px', lineHeight: 1.5 }}>{hint}</span>}
    </div>
  );
}

const rInput = {
  minHeight: '44px', padding: '10px 12px', background: '#0F0F0F',
  border: '1px solid #333', borderRadius: '4px', color: '#F5F5F5',
  fontSize: '13px', width: '100%', fontFamily: 'inherit',
};

const rCheck = {
  display: 'flex', alignItems: 'center', gap: '8px',
  color: '#F5F5F5', fontSize: '13px', cursor: 'pointer', minHeight: '44px',
};
