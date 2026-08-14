'use client';

import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

const RATING_STARS = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1>REVIEWS</h1>
          <p>Moderate customer reviews and feedback.{pendingCount > 0 && ` ${pendingCount} pending review${pendingCount > 1 ? 's' : ''}.`}</p>
        </div>
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

      {loading ? (
        <p style={{ padding: '40px', color: '#666' }}>Loading reviews...</p>
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
