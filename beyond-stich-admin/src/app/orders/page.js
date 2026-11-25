'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../products/page.module.css';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadState from '@/components/LoadState';
import fetchJson from '@/lib/fetchJson';
import {
  allowedNext,
  nextStatus as getNextStatus,
  describeTransition,
  isTerminal,
} from '@/lib/orderFlow';

const STATUS_COLORS = {
  placed: { border: '#F5C518', color: '#F5C518' },
  confirmed: { border: '#3B82F6', color: '#3B82F6' },
  shipped: { border: '#06B6D4', color: '#06B6D4' },
  out_for_delivery: { border: '#7C3AED', color: '#7C3AED' },
  delivered: { border: '#22C55E', color: '#22C55E' },
  cancelled: { border: '#EF4444', color: '#EF4444' },
  returned: { border: '#94A3B8', color: '#94A3B8' },
};

// The legal flow lives in lib/orderFlow.js, shared with the API so the
// dropdown can never offer a move the server will reject. It used to list
// all seven statuses unconditionally, which is how a delivered order could
// be cancelled.

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfil, setFulfil] = useState({ orderStatus: 'placed', trackingNumber: '', notes: '' });
  const [savingFulfil, setSavingFulfil] = useState(false);
  const [refund, setRefund] = useState({ refundAmount: 0, refundReason: '', refundStatus: 'none' });
  const [savingRefund, setSavingRefund] = useState(false);
  // Pending destructive action, held until the user confirms it.
  // { title, message, effects, danger, confirmLabel, run }
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Declared before the effect that schedules it, and memoised on the
  // filters it reads. Previously it was a plain function defined *after* the
  // effect: the effect captured whichever instance existed at mount, so a
  // later change to statusFilter/searchTerm re-ran a stale closure.
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      // fetchJson throws on a non-2xx, so a 500 can no longer land here
      // looking like an empty order list.
      const data = await fetchJson(`/api/orders?${params}`);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setLoadError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  // Re-query on search too, debounced. Previously only Enter triggered a
  // fetch, and a second client-side filter then hid any row the server
  // matched on a field the client didn't check (phone, email).
  useEffect(() => {
    const t = setTimeout(fetchOrders, searchTerm ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchOrders, searchTerm]);

  const handleSearch = () => fetchOrders();

  // Performs the status change. Callers are responsible for confirming
  // anything destructive first — see requestStatusChange.
  const applyStatusChange = async (order, newStatus) => {
    const res = await fetch(`/api/orders/${order._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: newStatus }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // The API is the authority on what is legal, so surface its reason
      // verbatim rather than a generic failure.
      alert(data.error || 'Failed to update');
      return false;
    }

    setOrders((prev) =>
      prev.map((o) => (o._id === order._id ? { ...o, ...data.order } : o))
    );
    if (selectedOrder?._id === order._id) {
      setSelectedOrder((prev) => ({ ...prev, ...data.order }));
      setFulfil((f) => ({ ...f, orderStatus: newStatus }));
    }

    if (data.stockRestored > 0) {
      alert(`Order updated. ${data.stockRestored} unit(s) returned to stock.`);
    }
    return true;
  };

  /**
   * Entry point for every status change in the UI.
   *
   * Destructive moves (cancel, return) are routed through a confirmation
   * that spells out what will happen — stock movement, emails sent, money
   * already taken — instead of firing on a single click.
   */
  const requestStatusChange = (order, newStatus) => {
    const { destructive, effects } = describeTransition(order, newStatus);

    if (!destructive) {
      applyStatusChange(order, newStatus);
      return;
    }

    setConfirm({
      title: newStatus === 'cancelled' ? 'Cancel this order?' : 'Mark as returned?',
      message: `Order ${order.orderNumber} — ${order.shippingAddress?.fullName || 'Guest'}`,
      effects,
      danger: true,
      confirmLabel: newStatus === 'cancelled' ? 'Cancel order' : 'Mark returned',
      cancelLabel: 'Keep as is',
      run: () => applyStatusChange(order, newStatus),
    });
  };

  // Runs whatever the open dialog is guarding, then closes it.
  const runConfirmed = async () => {
    if (!confirm?.run) return;
    setConfirmBusy(true);
    try {
      await confirm.run();
    } finally {
      setConfirmBusy(false);
      setConfirm(null);
    }
  };

  const openOrder = (order) => {
    setSelectedOrder(order);
    setFulfil({
      orderStatus: order.orderStatus || 'placed',
      trackingNumber: order.trackingNumber || '',
      notes: order.notes || '',
    });
    setRefund({
      refundAmount: order.refundAmount || order.total || 0,
      refundReason: order.refundReason || '',
      refundStatus: order.refundStatus || 'none',
    });
  };

  const saveReturnStatus = async (returnStatus) => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update return');
        return;
      }
      const patch = {
        returnRequest: {
          ...selectedOrder.returnRequest,
          status: returnStatus,
          resolvedAt: new Date().toISOString(),
        },
      };
      setOrders((prev) =>
        prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...patch } : o))
      );
      setSelectedOrder((prev) => (prev ? { ...prev, ...patch } : prev));
    } catch {
      alert('Network error');
    }
  };

  const doSaveFulfilment = async () => {
    setSavingFulfil(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fulfil),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o._id === selectedOrder._id ? { ...o, ...data.order } : o
        ));
        setSelectedOrder(prev => (prev ? { ...prev, ...data.order } : prev));
        alert(
          data.stockRestored > 0
            ? `Order updated. ${data.stockRestored} unit(s) returned to stock.`
            : 'Order updated'
        );
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingFulfil(false);
    }
  };

  const saveFulfilment = () => {
    if (!selectedOrder) return;

    // Saving the panel can change status too, so it needs the same guard as
    // the quick-action buttons — otherwise cancelling via the dropdown would
    // skip the confirmation entirely.
    const { destructive, effects } = describeTransition(selectedOrder, fulfil.orderStatus);
    if (!destructive || fulfil.orderStatus === selectedOrder.orderStatus) {
      doSaveFulfilment();
      return;
    }

    setConfirm({
      title: fulfil.orderStatus === 'cancelled' ? 'Cancel this order?' : 'Mark as returned?',
      message: `Order ${selectedOrder.orderNumber} — ${selectedOrder.shippingAddress?.fullName || 'Guest'}`,
      effects,
      danger: true,
      confirmLabel: fulfil.orderStatus === 'cancelled' ? 'Cancel order' : 'Mark returned',
      cancelLabel: 'Keep as is',
      run: doSaveFulfilment,
    });
  };

  const saveRefund = () => {
    if (!selectedOrder) return;

    // Marking a refund 'processed' flips the order to refunded AND emails
    // the customer that their money is on the way. If that is wrong, the
    // message cannot be unsent — so it is the one refund state that needs
    // confirming.
    if (refund.refundStatus === 'processed' && selectedOrder.refundStatus !== 'processed') {
      setConfirm({
        title: 'Process this refund?',
        message: `Order ${selectedOrder.orderNumber} — ${selectedOrder.shippingAddress?.fullName || 'Guest'}`,
        effects: [
          `₹${Number(refund.refundAmount || 0).toLocaleString('en-IN')} will be recorded as refunded.`,
          'The order will be marked PAYMENT: REFUNDED.',
          'The customer will be emailed that their refund is on the way.',
          'Transfer the money through Razorpay or your bank separately — this only records it.',
        ],
        danger: true,
        confirmLabel: 'Process refund',
        run: doSaveRefund,
      });
      return;
    }

    doSaveRefund();
  };

  const doSaveRefund = async () => {
    setSavingRefund(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refund),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o =>
          o._id === selectedOrder._id ? { ...o, ...data.order } : o
        ));
        setSelectedOrder(prev => (prev ? { ...prev, ...data.order } : prev));
        alert(refund.refundStatus === 'processed' ? 'Refund processed & email sent' : 'Refund updated');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update refund');
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingRefund(false);
    }
  };

  // The server already applied the search filter; re-filtering here on a
  // narrower set of fields only hid legitimate matches.
  const filteredOrders = orders;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1>ORDERS</h1>
          <p>Track and manage incoming shipments.</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search Order ID or Customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading || loadError || orders.length === 0 ? (
        <LoadState
          loading={loading}
          error={loadError}
          onRetry={fetchOrders}
          empty={orders.length === 0}
          loadingText="Loading orders…"
          emptyText={
            statusFilter !== 'all' || searchTerm
              ? 'No orders match this filter.'
              : 'No orders yet. They appear here as customers place them.'
          }
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>DATE</th>
                <th>CUSTOMER</th>
                <th>TOTAL</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const sc = STATUS_COLORS[order.orderStatus] || STATUS_COLORS.placed;
                const nextStatus = getNextStatus(order.orderStatus);

                return (
                  <tr key={order._id}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
                      {order.orderNumber}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td>{order.user?.name || order.shippingAddress?.fullName || 'Guest'}</td>
                    <td>₹{order.total?.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={styles.segmentBadge} style={{ borderColor: sc.border, color: sc.color }}>
                        {order.orderStatus?.toUpperCase().replace('_', ' ')}
                      </span>
                      {order.refundStatus && order.refundStatus !== 'none' && (
                        <span className={styles.segmentBadge} style={{
                          borderColor: order.refundStatus === 'processed' ? '#22C55E' : order.refundStatus === 'pending' ? '#F5C518' : '#EF4444',
                          color: order.refundStatus === 'processed' ? '#22C55E' : order.refundStatus === 'pending' ? '#F5C518' : '#EF4444',
                          marginLeft: '6px',
                          fontSize: '10px',
                        }}>
                          REFUND {order.refundStatus.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => openOrder(order)}>VIEW</button>
                        {nextStatus && (
                          <button
                            className={styles.editBtn}
                            style={{ color: '#22C55E' }}
                            onClick={() => requestStatusChange(order, nextStatus)}
                          >
                            MARK {nextStatus.toUpperCase().replace('_', ' ')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={modalStyles.overlay} onClick={() => setSelectedOrder(null)}>
          <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2>ORDER {selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} style={modalStyles.closeBtn}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px' }}>CUSTOMER</h4>
                <p style={{ color: '#F5F5F5' }}>{selectedOrder.user?.name || selectedOrder.shippingAddress?.fullName}</p>
                <p style={{ color: '#888', fontSize: '12px' }}>{selectedOrder.user?.email || selectedOrder.email || '—'}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px' }}>SHIPPING ADDRESS</h4>
                <p style={{ color: '#F5F5F5', fontSize: '13px' }}>
                  {selectedOrder.shippingAddress?.fullName}<br />
                  {selectedOrder.shippingAddress?.street}<br />
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} — {selectedOrder.shippingAddress?.pincode}
                </p>
                {/* The phone is what you need to hand a courier or call about
                    a failed delivery, and it wasn't shown anywhere. */}
                {selectedOrder.shippingAddress?.phone && (
                  <p style={{ marginTop: '8px', fontSize: '13px' }}>
                    <a
                      href={`tel:${selectedOrder.shippingAddress.phone}`}
                      style={{ color: '#4ADE80', fontWeight: 600 }}
                    >
                      📞 {selectedOrder.shippingAddress.phone}
                    </a>
                    <a
                      href={`https://wa.me/91${String(selectedOrder.shippingAddress.phone).replace(/\D/g, '').slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#25D366', marginLeft: '12px', fontWeight: 600 }}
                    >
                      WhatsApp
                    </a>
                  </p>
                )}
                {selectedOrder.email && (
                  <p style={{ marginTop: '4px', fontSize: '12px', color: '#888' }}>
                    {selectedOrder.email}
                  </p>
                )}
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px' }}>PAYMENT</h4>
                <p style={{ color: '#F5F5F5' }}>₹{selectedOrder.total?.toLocaleString('en-IN')}</p>
                <p style={{ color: '#888', fontSize: '12px' }}>
                  {selectedOrder.paymentMethod === 'cod' ? 'COD' : selectedOrder.paymentMethod === 'online' ? 'ONLINE' : selectedOrder.paymentMethod?.toUpperCase() || 'N/A'} • {selectedOrder.paymentStatus?.toUpperCase()} {selectedOrder.paymentId ? `• ${selectedOrder.paymentId}` : ''}
                </p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px' }}>TRACKING</h4>
                <p style={{ color: '#F5F5F5' }}>{selectedOrder.trackingNumber || 'Not assigned'}</p>
              </div>
            </div>

            {/* Fulfilment controls */}
            <div style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '12px', letterSpacing: '0.08em' }}>FULFILMENT</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#888', fontSize: '11px' }}>Status</label>
                  <select
                    value={fulfil.orderStatus}
                    onChange={e => setFulfil(f => ({ ...f, orderStatus: e.target.value }))}
                    style={fulfilStyles.input}
                    disabled={isTerminal(selectedOrder.orderStatus)}
                  >
                    {/* Current status first, then only what may legally
                        follow it. Listing all seven regardless is what
                        allowed delivered -> cancelled. */}
                    <option value={selectedOrder.orderStatus}>
                      {selectedOrder.orderStatus?.toUpperCase().replace(/_/g, ' ')} (current)
                    </option>
                    {allowedNext(selectedOrder.orderStatus).map(s => (
                      <option key={s} value={s}>{s.toUpperCase().replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  {isTerminal(selectedOrder.orderStatus) && (
                    <span style={{ color: '#8A8A8A', fontSize: '11px', lineHeight: 1.5 }}>
                      {selectedOrder.orderStatus === 'cancelled' ? 'Cancelled' : 'Returned'} is
                      final — the status can no longer be changed.
                    </span>
                  )}
                  {selectedOrder.orderStatus === 'delivered' && (
                    <span style={{ color: '#8A8A8A', fontSize: '11px', lineHeight: 1.5 }}>
                      Delivered orders can only be RETURNED, not cancelled.
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#888', fontSize: '11px' }}>Tracking number</label>
                  <input
                    value={fulfil.trackingNumber}
                    onChange={e => setFulfil(f => ({ ...f, trackingNumber: e.target.value }))}
                    placeholder="e.g. BLUEDART-12345"
                    style={fulfilStyles.input}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                <label style={{ color: '#888', fontSize: '11px' }}>Internal notes</label>
                <textarea
                  value={fulfil.notes}
                  onChange={e => setFulfil(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes visible to the ops team only"
                  style={{ ...fulfilStyles.input, minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <button onClick={saveFulfilment} disabled={savingFulfil} style={fulfilStyles.saveBtn}>
                {savingFulfil ? 'SAVING…' : 'SAVE CHANGES'}
              </button>
            </div>

            {/* Customer-raised return request. Previously customers had no
                way to start a return, so this never had anything to show. */}
            {selectedOrder.returnRequest?.status &&
              selectedOrder.returnRequest.status !== 'none' && (
              <div style={{ background: '#1A1A1A', border: '1px solid #F5C518', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ color: '#F5C518', fontSize: '11px', marginBottom: '12px', letterSpacing: '0.08em' }}>
                  RETURN REQUEST — {selectedOrder.returnRequest.status.toUpperCase()}
                </h4>
                <p style={{ color: '#F5F5F5', fontSize: '13px', lineHeight: 1.6, marginBottom: '12px' }}>
                  “{selectedOrder.returnRequest.reason}”
                </p>
                <p style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
                  Raised {selectedOrder.returnRequest.requestedAt
                    ? formatDate(selectedOrder.returnRequest.requestedAt)
                    : '—'}
                </p>
                {selectedOrder.returnRequest.status === 'requested' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => saveReturnStatus('approved')}
                      style={{ ...fulfilStyles.saveBtn, background: '#22C55E', minHeight: '44px' }}
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => saveReturnStatus('rejected')}
                      style={{ ...fulfilStyles.saveBtn, background: '#EF4444', minHeight: '44px' }}
                    >
                      REJECT
                    </button>
                  </div>
                )}
                {selectedOrder.returnRequest.status === 'approved' && (
                  <button
                    onClick={() => saveReturnStatus('completed')}
                    style={{ ...fulfilStyles.saveBtn, minHeight: '44px' }}
                  >
                    MARK RETURN COMPLETE
                  </button>
                )}
              </div>
            )}

            {/* Refund controls — visible for returned/cancelled orders */}
            {['returned', 'cancelled'].includes(selectedOrder.orderStatus) && (
              <div style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ color: '#EF4444', fontSize: '11px', marginBottom: '12px', letterSpacing: '0.08em' }}>REFUND</h4>
                {selectedOrder.refundStatus === 'processed' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ color: '#22C55E', fontWeight: 700, fontSize: '14px' }}>REFUND PROCESSED</p>
                    <p style={{ color: '#888', fontSize: '12px' }}>Amount: ₹{(selectedOrder.refundAmount || 0).toLocaleString('en-IN')}</p>
                    {selectedOrder.refundReason && <p style={{ color: '#888', fontSize: '12px' }}>Reason: {selectedOrder.refundReason}</p>}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ color: '#888', fontSize: '11px' }}>Refund Amount (₹)</label>
                        <input
                          type="number"
                          value={refund.refundAmount}
                          onChange={e => setRefund(r => ({ ...r, refundAmount: parseFloat(e.target.value) || 0 }))}
                          style={fulfilStyles.input}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ color: '#888', fontSize: '11px' }}>Status</label>
                        <select
                          value={refund.refundStatus}
                          onChange={e => setRefund(r => ({ ...r, refundStatus: e.target.value }))}
                          style={fulfilStyles.input}
                        >
                          <option value="none">None</option>
                          <option value="pending">Pending</option>
                          <option value="processed">Processed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                      <label style={{ color: '#888', fontSize: '11px' }}>Reason</label>
                      <input
                        value={refund.refundReason}
                        onChange={e => setRefund(r => ({ ...r, refundReason: e.target.value }))}
                        placeholder="e.g. Customer requested return"
                        style={fulfilStyles.input}
                      />
                    </div>
                    <button onClick={saveRefund} disabled={savingRefund} style={{ ...fulfilStyles.saveBtn, background: '#EF4444' }}>
                      {savingRefund ? 'PROCESSING…' : refund.refundStatus === 'processed' ? 'PROCESS REFUND & NOTIFY' : 'SAVE REFUND'}
                    </button>
                  </>
                )}
              </div>
            )}

            <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>ITEMS ({selectedOrder.items?.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedOrder.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: '#1A1A1A', borderRadius: '4px' }}>
                  {item.image && <img src={item.image} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '2px' }} />}
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#F5F5F5', fontWeight: 700, fontSize: '13px' }}>{item.name}</p>
                    <p style={{ color: '#888', fontSize: '11px' }}>Size: {item.size} • Color: {item.color} • Qty: {item.quantity}</p>
                  </div>
                  <p style={{ color: '#F5F5F5', fontWeight: 700 }}>₹{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guards every irreversible action: cancel, return, process refund. */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        effects={confirm?.effects || []}
        danger={confirm?.danger}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel={confirm?.cancelLabel}
        busy={confirmBusy}
        onConfirm={runConfirmed}
        onCancel={() => !confirmBusy && setConfirm(null)}
      />
    </div>
  );
}

const fulfilStyles = {
  input: { padding: '10px 12px', background: '#0F0F0F', border: '1px solid #333', borderRadius: '4px', color: '#F5F5F5', fontSize: '13px', width: '100%' },
  saveBtn: { marginTop: '16px', padding: '12px 20px', background: '#22C55E', color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.08em', cursor: 'pointer' },
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px', overflowY: 'auto' },
  modal: { background: '#111', border: '1px solid #333', borderRadius: '8px', width: '100%', maxWidth: '650px', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
};
