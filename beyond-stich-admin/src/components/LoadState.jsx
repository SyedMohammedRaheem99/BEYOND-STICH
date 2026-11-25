'use client';

/**
 * One place that decides what a list screen shows before its rows arrive.
 *
 * Written after admin orders and the dashboard returned HTTP 500 on every
 * request for an unknown length of time without anyone noticing. Each page
 * did:
 *
 *     const res = await fetch('/api/orders');
 *     if (res.ok) setOrders(data.orders);   // on failure, silently keep []
 *
 * so a total outage rendered as the empty state. The orders page said
 * "No orders yet" while 18 real orders sat in the database and every
 * request failed. Empty and broken MUST NOT look the same — an outage has
 * to be loud, or it hides until a customer reports it.
 *
 * Usage: render it instead of the table body when it returns something.
 *
 *     const state = <LoadState loading={loading} error={error}
 *                              onRetry={fetchOrders} empty={!orders.length}
 *                              emptyText="No orders yet." />;
 *     if (state) return state;
 */
export default function LoadState({
  loading,
  error,
  onRetry,
  empty,
  emptyText = 'Nothing here yet.',
  loadingText = 'Loading…',
}) {
  if (loading) {
    return <p style={wrap}>{loadingText}</p>;
  }

  if (error) {
    return (
      <div style={{ ...wrap, color: '#F5F5F5' }}>
        <p style={{ fontWeight: 700, marginBottom: '8px' }}>Could not load this.</p>
        {/* The real reason, not a generic apology: "Failed to fetch" and
            "500" send you to very different places. */}
        <p style={{ color: '#A0A0A0', fontSize: '13px', marginBottom: '18px' }}>
          {typeof error === 'string' ? error : 'The request failed.'}
        </p>
        <p style={{ color: '#666', fontSize: '12px', marginBottom: '18px' }}>
          This is a loading failure, not an empty list — your data is still there.
        </p>
        {onRetry && (
          <button onClick={onRetry} style={retryBtn}>TRY AGAIN</button>
        )}
      </div>
    );
  }

  if (empty) {
    return <p style={wrap}>{emptyText}</p>;
  }

  return null;
}

const wrap = {
  color: '#666',
  padding: '48px 24px',
  textAlign: 'center',
};

const retryBtn = {
  minHeight: '44px',
  padding: '10px 22px',
  background: '#F5F5F5',
  color: '#0A0A0A',
  border: 'none',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  cursor: 'pointer',
};
