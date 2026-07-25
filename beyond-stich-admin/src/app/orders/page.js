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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

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

  const filteredOrders = orders.filter(o =>
    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => setSelectedOrder(order)}>VIEW</button>
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
                <p style={{ color: '#888', fontSize: '12px' }}>{selectedOrder.user?.email}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px' }}>SHIPPING ADDRESS</h4>
                <p style={{ color: '#F5F5F5', fontSize: '13px' }}>
                  {selectedOrder.shippingAddress?.street}<br />
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} — {selectedOrder.shippingAddress?.pincode}
                </p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px' }}>PAYMENT</h4>
                <p style={{ color: '#F5F5F5' }}>₹{selectedOrder.total?.toLocaleString('en-IN')}</p>
                <p style={{ color: '#888', fontSize: '12px' }}>
                  {selectedOrder.paymentStatus?.toUpperCase()} • {selectedOrder.paymentId || 'N/A'}
                </p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '6px' }}>TRACKING</h4>
                <p style={{ color: '#F5F5F5' }}>{selectedOrder.trackingNumber || 'Not assigned'}</p>
              </div>
            </div>

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

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px', overflowY: 'auto' },
  modal: { background: '#111', border: '1px solid #333', borderRadius: '8px', width: '100%', maxWidth: '650px', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
};
