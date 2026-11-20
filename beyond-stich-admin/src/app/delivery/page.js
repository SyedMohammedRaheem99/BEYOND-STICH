'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../products/page.module.css';
import ConfirmDialog from '@/components/ConfirmDialog';

// Mirrors ZONE_DAYS in the storefront's lib/serviceability.js. Shown so the
// operator can see what a tier means without opening the code.
const TIERS = [
  { value: 'local', label: 'Bengaluru', days: '1–2 days' },
  { value: 'nearby', label: 'Nearby', days: '2–4 days' },
  { value: 'rest', label: 'Rest of India', days: '4–7 days' },
];

const EMPTY = {
  name: '',
  rangeStart: '',
  rangeEnd: '',
  zone: 'local',
  deliveryDaysMin: '',
  deliveryDaysMax: '',
  codAvailable: true,
  active: true,
};

export default function AdminDelivery() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // zone object, or 'new'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  // Lets the operator confirm a real PIN code resolves the way they expect,
  // using the same endpoint the storefront calls.
  const [testPin, setTestPin] = useState('');
  const [testResult, setTestResult] = useState(null);

  const fetchZones = useCallback(async ({ showSpinner = true } = {}) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch('/api/delivery');
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones || []);
      }
    } catch (err) {
      console.error('Fetch delivery areas error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the first state update happens in the fetch callback
    // rather than synchronously inside the effect body, which React flags
    // as a cascading render.
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchZones();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchZones]);

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };

  const openEdit = (z) => {
    setForm({
      name: z.name || '',
      rangeStart: String(z.rangeStart || ''),
      rangeEnd: String(z.rangeEnd || ''),
      zone: z.zone || 'rest',
      deliveryDaysMin: z.deliveryDaysMin ?? '',
      deliveryDaysMax: z.deliveryDaysMax ?? '',
      codAvailable: z.codAvailable !== false,
      active: z.active !== false,
    });
    setEditing(z);
  };

  const save = async () => {
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const res = await fetch(isNew ? '/api/delivery' : `/api/delivery/${editing._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save');
        return;
      }
      setEditing(null);
      fetchZones();
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  // Toggling off is the normal way to close an area: the range and its
  // timings survive, so reopening later needs no re-entry.
  const toggleActive = async (z) => {
    try {
      const res = await fetch(`/api/delivery/${z._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !z.active }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update');
        return;
      }
      fetchZones();
    } catch {
      alert('Network error');
    }
  };

  const remove = (z) => {
    setConfirm({
      title: 'Delete this area?',
      message: `${z.name} — ${z.rangeStart}–${z.rangeEnd}`,
      effects: [
        'Customers in this PIN range will no longer be able to order.',
        'Switching it off instead keeps the settings for later.',
      ],
      danger: true,
      confirmLabel: 'Delete',
      run: async () => {
        const res = await fetch(`/api/delivery/${z._id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Failed to delete');
          return;
        }
        fetchZones();
      },
    });
  };

  const runTest = async (e) => {
    e.preventDefault();
    setTestResult(null);
    const pin = testPin.trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setTestResult({ serviceable: false, reason: 'Enter a valid 6-digit PIN code' });
      return;
    }
    try {
      // Hits the storefront, so this reflects exactly what a customer sees.
      const base = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/api/delivery/check?pincode=${pin}`);
      setTestResult(await res.json());
    } catch {
      setTestResult({ serviceable: false, reason: 'Could not reach the storefront' });
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>DELIVERY AREAS</h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Where the store ships. A PIN code outside every active area is told
            &ldquo;we don&apos;t deliver here yet&rdquo; and cannot check out.
          </p>
        </div>
        <button className={styles.addBtn} onClick={openNew}>+ ADD AREA</button>
      </div>

      {/* PIN tester */}
      <form
        onSubmit={runTest}
        style={{
          display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
          background: '#111', border: '1px solid #2A2A2A', borderRadius: '8px',
          padding: '14px 16px', marginBottom: '20px',
        }}
      >
        <span style={{ color: '#888', fontSize: '11px', letterSpacing: '0.1em' }}>TEST A PIN CODE</span>
        <input
          value={testPin}
          onChange={(e) => setTestPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="560001"
          inputMode="numeric"
          style={{
            padding: '8px 12px', background: '#0F0F0F', border: '1px solid #333',
            borderRadius: '4px', color: '#F5F5F5', fontSize: '13px', width: '120px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px', background: '#F5C518', color: '#0A0A0A', border: 'none',
            borderRadius: '4px', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
          }}
        >
          CHECK
        </button>
        {testResult && (
          <span style={{ fontSize: '13px', color: testResult.serviceable ? '#22C55E' : '#EF4444' }}>
            {testResult.serviceable
              ? `${testResult.etaLabel}${testResult.codAvailable ? ' · COD available' : ' · prepaid only'}`
              : testResult.reason}
          </span>
        )}
      </form>

      {loading ? (
        <p style={{ color: '#666', padding: '40px', textAlign: 'center' }}>Loading…</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>AREA</th>
                <th>PIN RANGE</th>
                <th>TIER</th>
                <th>DELIVERY</th>
                <th>COD</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {zones.length > 0 ? zones.map((z) => {
                const tier = TIERS.find((t) => t.value === z.zone);
                const custom =
                  z.deliveryDaysMin !== null && z.deliveryDaysMax !== null
                    ? `${z.deliveryDaysMin}–${z.deliveryDaysMax} days`
                    : tier?.days || '—';
                return (
                  <tr key={z._id} style={{ opacity: z.active ? 1 : 0.45 }}>
                    <td style={{ fontWeight: 700 }}>{z.name}</td>
                    <td style={{ fontFamily: 'monospace', color: '#A0A0A0' }}>
                      {z.rangeStart}–{z.rangeEnd}
                    </td>
                    <td>{tier?.label || z.zone}</td>
                    <td style={{ color: '#A0A0A0' }}>{custom}</td>
                    <td style={{ color: z.codAvailable ? '#22C55E' : '#888' }}>
                      {z.codAvailable ? 'Yes' : 'No'}
                    </td>
                    <td>
                      <span
                        className={styles.segmentBadge}
                        style={{
                          borderColor: z.active ? '#22C55E' : '#666',
                          color: z.active ? '#22C55E' : '#888',
                        }}
                      >
                        {z.active ? 'ACTIVE' : 'OFF'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => openEdit(z)}>EDIT</button>
                        <button className={styles.editBtn} onClick={() => toggleActive(z)}>
                          {z.active ? 'TURN OFF' : 'TURN ON'}
                        </button>
                        <button
                          className={styles.editBtn}
                          style={{ color: '#EF4444' }}
                          onClick={() => remove(z)}
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                    No delivery areas yet — the store will refuse every order.
                    Add one, or run <code>node scripts/seed-delivery.mjs</code> in the storefront.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / edit */}
      {editing && (
        <div style={modal.overlay} onClick={() => !saving && setEditing(null)}>
          <div style={modal.panel} onClick={(e) => e.stopPropagation()}>
            <div style={modal.header}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em' }}>
                {editing === 'new' ? 'ADD DELIVERY AREA' : 'EDIT DELIVERY AREA'}
              </h2>
              <button style={modal.close} onClick={() => setEditing(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Area name">
                <input
                  style={input}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Bengaluru City"
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Start PIN">
                  <input
                    style={input}
                    inputMode="numeric"
                    value={form.rangeStart}
                    onChange={(e) => setForm((f) => ({ ...f, rangeStart: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="560001"
                  />
                </Field>
                <Field label="End PIN">
                  <input
                    style={input}
                    inputMode="numeric"
                    value={form.rangeEnd}
                    onChange={(e) => setForm((f) => ({ ...f, rangeEnd: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="560999"
                  />
                </Field>
              </div>

              <Field label="Delivery tier">
                <select
                  style={input}
                  value={form.zone}
                  onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
                >
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label} ({t.days})</option>
                  ))}
                </select>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Min days (optional)">
                  <input
                    style={input}
                    inputMode="numeric"
                    value={form.deliveryDaysMin}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryDaysMin: e.target.value.replace(/\D/g, '') }))}
                    placeholder="tier default"
                  />
                </Field>
                <Field label="Max days (optional)">
                  <input
                    style={input}
                    inputMode="numeric"
                    value={form.deliveryDaysMax}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryDaysMax: e.target.value.replace(/\D/g, '') }))}
                    placeholder="tier default"
                  />
                </Field>
              </div>

              <label style={check}>
                <input
                  type="checkbox"
                  checked={form.codAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, codAvailable: e.target.checked }))}
                />
                Cash on delivery available here
              </label>

              <label style={check}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active — customers here can order
              </label>

              <button
                onClick={save}
                disabled={saving}
                style={{
                  marginTop: '6px', padding: '12px', background: saving ? '#555' : '#22C55E',
                  color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 800,
                  fontSize: '13px', letterSpacing: '0.08em', cursor: saving ? 'default' : 'pointer',
                }}
              >
                {saving ? 'SAVING…' : 'SAVE AREA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        effects={confirm?.effects || []}
        danger={confirm?.danger}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={async () => {
          await confirm?.run?.();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: '#888', fontSize: '11px', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );
}

const input = {
  padding: '10px 12px', background: '#0F0F0F', border: '1px solid #333',
  borderRadius: '4px', color: '#F5F5F5', fontSize: '13px', width: '100%',
};

const check = {
  display: 'flex', alignItems: 'center', gap: '8px',
  color: '#F5F5F5', fontSize: '13px', cursor: 'pointer',
};

const modal = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    padding: '40px 16px', overflowY: 'auto',
  },
  panel: {
    background: '#111', border: '1px solid #333', borderRadius: '10px',
    width: '100%', maxWidth: '520px', padding: '28px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '22px',
  },
  close: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
};
