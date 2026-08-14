'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import styles from './page.module.css';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [provider, setProvider] = useState('credentials');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
          });
          setProvider(data.user.provider || 'credentials');
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchProfile();
    else setLoading(false);
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.profilePage}><p style={{ color: '#666', padding: '40px 0' }}>Loading...</p></div>;
  }

  return (
    <div className={styles.profilePage}>
      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        PROFILE
      </motion.h1>
      <p>Manage your personal information.</p>

      {message.text && (
        <div className={message.type === 'success' ? styles.success : styles.error}>
          {message.text}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="name">FULL NAME</label>
          <input
            id="name"
            type="text"
            className={styles.input}
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">EMAIL</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={form.email}
            disabled
          />
          {provider === 'google' && (
            <span className={styles.providerNote}>Signed in with Google — email cannot be changed.</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="phone">PHONE NUMBER</label>
          <input
            id="phone"
            type="tel"
            className={styles.input}
            value={form.phone}
            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>

        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </form>
    </div>
  );
}
