'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import styles from './page.module.css';

const EMPTY_ADDR = { fullName: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false };

export default function AddressesPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ADDR });
  const [saving, setSaving] = useState(false);
  // Native alert()/confirm() are blocking OS dialogs that read as spam on
  // mobile; show the message in the page instead.
  const [pageError, setPageError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (session) fetchAddresses();
    else setLoading(false);
  }, [session]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error('Fetch addresses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_ADDR });
    setModalOpen(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr._id);
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...form, addressId: editingId } : form;

      const res = await fetch('/api/user/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
        setModalOpen(false);
      } else {
        const data = await res.json();
        setPageError(data.error || 'Failed to save');
      }
    } catch {
      setPageError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch {
      setPageError('Network error. Please try again.');
    }
  };

  const setDefault = async (id) => {
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: id, isDefault: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch {
      setPageError('Network error. Please try again.');
    }
  };

  const update = (field) => (e) => {
    const val = field === 'isDefault' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
  };

  return (
    <div className={styles.addressPage}>
      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        MY ADDRESSES
      </motion.h1>
      <p>Manage your saved shipping addresses.</p>

      {pageError && (
        <p className={styles.pageError} role="alert">{pageError}</p>
      )}

      <button className={styles.addBtn} onClick={openAdd}>+ ADD NEW ADDRESS</button>

      {loading ? (
        <p className={styles.emptyState}>Loading...</p>
      ) : addresses.length > 0 ? (
        <div className={styles.addressList}>
          {addresses.map((addr, i) => (
            <motion.div
              key={addr._id}
              className={`${styles.addressCard} ${addr.isDefault ? styles.isDefault : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              {addr.isDefault && <span className={styles.defaultTag}>DEFAULT</span>}
              <div className={styles.addrName}>{addr.fullName}</div>
              <div className={styles.addrPhone}>{addr.phone}</div>
              <div className={styles.addrStreet}>
                {addr.street}<br />
                {addr.city}, {addr.state} — {addr.pincode}
              </div>
              <div className={styles.addrActions}>
                <button className={styles.editAddrBtn} onClick={() => openEdit(addr)}>EDIT</button>
                <button
                  className={styles.deleteAddrBtn}
                  onClick={() => handleDelete(addr._id)}
                  onBlur={() => confirmDeleteId === addr._id && setConfirmDeleteId(null)}
                >
                  {confirmDeleteId === addr._id ? 'TAP AGAIN TO CONFIRM' : 'DELETE'}
                </button>
                {!addr.isDefault && (
                  <button className={styles.setDefaultBtn} onClick={() => setDefault(addr._id)}>SET DEFAULT</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>No saved addresses. Add one to speed up checkout.</p>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'EDIT ADDRESS' : 'NEW ADDRESS'}</h2>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>FULL NAME</label>
                  <input className={styles.input} value={form.fullName} onChange={update('fullName')} required />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>PHONE</label>
                  <input className={styles.input} value={form.phone} onChange={update('phone')} required />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>STREET ADDRESS</label>
                <input className={styles.input} value={form.street} onChange={update('street')} required />
              </div>
              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>CITY</label>
                  <input className={styles.input} value={form.city} onChange={update('city')} required />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>STATE</label>
                  <input className={styles.input} value={form.state} onChange={update('state')} required />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>PINCODE</label>
                <input className={styles.input} value={form.pincode} onChange={update('pincode')} required maxLength="6" />
              </div>
              <div className={styles.checkGroup}>
                <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={update('isDefault')} />
                <label htmlFor="isDefault">Set as default address</label>
              </div>
              <button type="submit" className={styles.submitAddrBtn} disabled={saving}>
                {saving ? 'SAVING...' : editingId ? 'UPDATE ADDRESS' : 'ADD ADDRESS'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
