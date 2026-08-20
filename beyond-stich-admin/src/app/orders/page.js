'use client';

import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

const STATUS_COLORS = {
  placed: { border: '#F5C518', color: '#F5C518' },
  confirmed: { border: '#3B82F6', color: '#3B82F6' },
  shipped: { border: '#06B6D4', color: '#06B6D4' },
  out_for_delivery: { border: '#7C3AED', color: '#7C3AED' },
  delivered: { border: '#22C55E', color: '#22C55E' },
  cancelled: { border: '#EF4444', color: '#EF4444' },
  returned: { border: '#94A3B8', color: '#94A3B8' },
};

const STATUS_FLOW = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
const ALL_STATUSES = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

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

  // Re-query on search too, debounced. Previously only Enter triggered a
  // fetch, and a second client-side filter then hid any row the server
  // matched on a field the client didn't check (phone, email).
  useEffect(() => {
    const t = setTimeout(fetchOrders, searchTerm ? 350 : 0);
    return () => clearTimeout(t);
  }, [statusFilter, searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchOrders();

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o._id === orderId ? { ...o, orderStatus: newStatus } : o
        ));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update');
      }
    } catch {
      alert('Network error');
    }
  };

  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
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

  const saveFulfilment = async () => {
    if (!selectedOrder) return;
    setSavingFulfil(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fulfil),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o._id === selectedOrder._id ? { ...o, ...fulfil } : o
        ));
        setSelectedOrder(prev => (prev ? { ...prev, ...fulfil } : prev));
        alert('Order updated');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update');
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingFulfil(false);
    }
  };

  const saveRefund = async () => {
    if (!selectedOrder) return;
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

      {loading ? (
        <p style={{ padding: '40px', color: '#666' }}>Loading orders...</p>
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
              {filteredOrders.length > 0 ? filteredOrders.map(order => {
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
                            onClick={() => updateOrderStatus(order._id, nextStatus)}
                          >
                            MARK {nextStatus.toUpperCase().replace('_', ' ')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  No orders found. Orders will appear here when customers place them.
                </td></tr>
              )}
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
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{s.toUpperCase().replace(/_/g, ' ')}</option>
                    ))}
                  </select>
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
