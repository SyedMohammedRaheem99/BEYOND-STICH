'use client';

import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error('Fetch coupons error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) setCoupons((prev) => prev.filter((c) => c._id !== id));
      else alert('Failed to delete');
    } catch {
      alert('Network error');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === coupon._id ? { ...c, active: !c.active } : c))
        );
      }
    } catch {
      alert('Network error');
    }
  };

  const handleFormSubmit = async (form) => {
    try {
      const isEdit = !!editCoupon;
      const url = isEdit ? `/api/coupons/${editCoupon._id}` : '/api/coupons';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditCoupon(null);
        fetchCoupons();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch {
      alert('Network error');
    }
  };

  const describeValue = (c) => {
    if (c.type === 'percent') return `${c.value}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`;
    if (c.type === 'flat') return `₹${c.value}`;
    return 'Free shipping';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1>COUPONS</h1>
          <p>Create and manage discount codes for the store.</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditCoupon(null); setShowForm(true); }}>
          + ADD COUPON
        </button>
      </header>

      {loading ? (
        <p style={{ padding: '40px', color: '#666' }}>Loading coupons...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>CODE</th>
                <th>DISCOUNT</th>
                <th>MIN ORDER</th>
                <th>USAGE</th>
                <th>EXPIRES</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length > 0 ? coupons.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold', letterSpacing: '0.05em' }}>{c.code}</td>
                  <td>{describeValue(c)}</td>
                  <td>{c.minOrder ? `₹${c.minOrder}` : '—'}</td>
                  <td>{c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td style={{ color: '#888' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                  <td>
                    <span
                      className={styles.segmentBadge}
                      style={{ borderColor: c.active ? '#22C55E' : '#EF4444', color: c.active ? '#22C55E' : '#EF4444', cursor: 'pointer' }}
                      onClick={() => toggleActive(c)}
                      title="Click to toggle"
                    >
                      {c.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => { setEditCoupon(c); setShowForm(true); }}>EDIT</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(c._id, c.code)}>DELETE</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  No coupons yet. Click &quot;+ ADD COUPON&quot; to create your first code.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CouponFormModal
          coupon={editCoupon}
          onClose={() => { setShowForm(false); setEditCoupon(null); }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

function CouponFormModal({ coupon, onClose, onSubmit }) {
  const [form, setForm] = useState({
    code: coupon?.code || '',
    type: coupon?.type || 'percent',
    value: coupon?.value ?? '',
    minOrder: coupon?.minOrder ?? 0,
    maxDiscount: coupon?.maxDiscount ?? 0,
    usageLimit: coupon?.usageLimit ?? 0,
    expiresAt: coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
    active: coupon?.active ?? true,
    description: coupon?.description || '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      code: form.code.trim().toUpperCase(),
      value: form.type === 'shipping' ? 0 : parseFloat(form.value) || 0,
      minOrder: parseFloat(form.minOrder) || 0,
      maxDiscount: parseFloat(form.maxDiscount) || 0,
      usageLimit: parseInt(form.usageLimit) || 0,
      expiresAt: form.expiresAt || null,
    });
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.modal} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}>
          <h2>{coupon ? 'EDIT COUPON' : 'CREATE COUPON'}</h2>
          <button onClick={onClose} style={m.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={m.form}>
          <div style={m.row}>
            <div style={m.field}>
              <label>Code *</label>
              <input value={form.code} onChange={(e) => set('code', e.target.value)} required placeholder="BEYOND10" style={{ ...m.input, textTransform: 'uppercase' }} />
            </div>
            <div style={m.field}>
              <label>Type *</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} style={m.input}>
                <option value="percent">Percent off (%)</option>
                <option value="flat">Flat off (₹)</option>
                <option value="shipping">Free shipping</option>
              </select>
            </div>
          </div>

          <div style={m.row}>
            {form.type !== 'shipping' && (
              <div style={m.field}>
                <label>{form.type === 'percent' ? 'Percent (%)' : 'Amount (₹)'} *</label>
                <input type="number" min="0" value={form.value} onChange={(e) => set('value', e.target.value)} required style={m.input} />
              </div>
            )}
            {form.type === 'percent' && (
              <div style={m.field}>
                <label>Max discount (₹, 0 = none)</label>
                <input type="number" min="0" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} style={m.input} />
              </div>
            )}
            <div style={m.field}>
              <label>Min order (₹)</label>
              <input type="number" min="0" value={form.minOrder} onChange={(e) => set('minOrder', e.target.value)} style={m.input} />
            </div>
          </div>

          <div style={m.row}>
            <div style={m.field}>
              <label>Usage limit (0 = unlimited)</label>
              <input type="number" min="0" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} style={m.input} />
            </div>
            <div style={m.field}>
              <label>Expires on</label>
              <input type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} style={m.input} />
            </div>
          </div>

          <div style={m.field}>
            <label>Description</label>
            <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="10% off your first order" style={m.input} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F5F5F5', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Active (available at checkout)
          </label>

          <button type="submit" style={m.submitBtn}>{coupon ? 'UPDATE COUPON' : 'CREATE COUPON'}</button>
        </form>
      </div>
    </div>
  );
}

const m = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px', overflowY: 'auto' },
  modal: { background: '#111', border: '1px solid #333', borderRadius: '8px', width: '100%', maxWidth: '640px', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'flex', gap: '16px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '10px 12px', background: '#1A1A1A', border: '1px solid #333', borderRadius: '4px', color: '#F5F5F5', fontSize: '13px' },
  submitBtn: { padding: '14px', background: '#F5F5F5', color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '14px', letterSpacing: '0.1em', cursor: 'pointer', marginTop: '8px' },
};
