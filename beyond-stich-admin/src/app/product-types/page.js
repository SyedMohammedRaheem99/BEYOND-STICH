'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../products/page.module.css';
import ConfirmDialog from '@/components/ConfirmDialog';

const EMPTY = {
  name: '',
  sizes: '',
  specTemplate: [{ label: '', defaultValue: '' }],
  chartColumns: '',
  chartRows: [],
  chartNote: '',
  measureGuide: [{ label: '', defaultValue: '' }],
  sortOrder: 0,
  active: true,
};

export default function AdminProductTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // type object, or 'new'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/product-types');
      if (res.ok) {
        const data = await res.json();
        setTypes(data.types || []);
      }
    } catch (err) {
      console.error('Fetch product types error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchTypes();
    })();
    return () => { cancelled = true; };
  }, [fetchTypes]);

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };

  const openEdit = (t) => {
    setForm({
      name: t.name || '',
      sizes: (t.sizes || []).join(', '),
      specTemplate: t.specTemplate?.length ? t.specTemplate : [{ label: '', defaultValue: '' }],
      chartColumns: (t.chartColumns || []).join(', '),
      // Mongo returns the Map as a plain object; the form edits it as one.
      chartRows: (t.chartRows || []).map((r) => ({
        size: r.size,
        measurements: { ...(r.measurements || {}) },
      })),
      chartNote: t.chartNote || '',
      measureGuide: t.measureGuide?.length ? t.measureGuide : [{ label: '', defaultValue: '' }],
      sortOrder: t.sortOrder ?? 0,
      active: t.active !== false,
    });
    setEditing(t);
  };

  const columns = form.chartColumns.split(',').map((c) => c.trim()).filter(Boolean);

  const save = async () => {
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const res = await fetch(isNew ? '/api/product-types' : `/api/product-types/${editing._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
          chartColumns: columns,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save');
        return;
      }
      if (data.productsRenamed > 0) {
        alert(`Saved. ${data.productsRenamed} product(s) moved to the new name.`);
      }
      setEditing(null);
      fetchTypes();
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const remove = (t) => {
    setConfirm({
      title: 'Delete this type?',
      message: t.name,
      effects: [
        'New products will no longer be able to use it.',
        'Refused if any product still uses this type.',
        'Switching it off instead keeps it for existing products.',
      ],
      danger: true,
      confirmLabel: 'Delete',
      run: async () => {
        const res = await fetch(`/api/product-types/${t._id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Failed to delete');
          return;
        }
        fetchTypes();
      },
    });
  };

  // --- repeatable row helpers ---
  const setPair = (key, i, field, value) =>
    setForm((f) => {
      const rows = [...f[key]];
      rows[i] = { ...rows[i], [field]: value };
      return { ...f, [key]: rows };
    });

  const addPair = (key) =>
    setForm((f) => ({ ...f, [key]: [...f[key], { label: '', defaultValue: '' }] }));

  const removePair = (key, i) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));

  const addChartRow = () =>
    setForm((f) => ({ ...f, chartRows: [...f.chartRows, { size: '', measurements: {} }] }));

  const setChartCell = (i, col, value) =>
    setForm((f) => {
      const rows = [...f.chartRows];
      rows[i] = { ...rows[i], measurements: { ...rows[i].measurements, [col]: value } };
      return { ...f, chartRows: rows };
    });

  const setChartSize = (i, value) =>
    setForm((f) => {
      const rows = [...f.chartRows];
      rows[i] = { ...rows[i], size: value };
      return { ...f, chartRows: rows };
    });

  const removeChartRow = (i) =>
    setForm((f) => ({ ...f, chartRows: f.chartRows.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>PRODUCT TYPES</h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Each type sets the default sizes, specification rows and size chart
            for a new product. All of it stays editable on the product itself.
          </p>
        </div>
        <button className={styles.addBtn} onClick={openNew}>+ ADD TYPE</button>
      </div>

      {loading ? (
        <p style={{ color: '#666', padding: '40px', textAlign: 'center' }}>Loading…</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TYPE</th>
                <th>SIZES</th>
                <th>SPEC ROWS</th>
                <th>SIZE CHART</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {types.length > 0 ? types.map((t) => (
                <tr key={t._id} style={{ opacity: t.active ? 1 : 0.45 }}>
                  <td style={{ fontWeight: 700 }}>{t.name}</td>
                  <td style={{ color: '#A0A0A0', fontSize: '12px' }}>
                    {(t.sizes || []).join(' · ') || '—'}
                  </td>
                  <td style={{ color: '#A0A0A0' }}>{t.specTemplate?.length || 0}</td>
                  <td style={{ color: '#A0A0A0' }}>
                    {t.chartRows?.length ? `${t.chartRows.length} rows` : 'none'}
                  </td>
                  <td>
                    <span
                      className={styles.segmentBadge}
                      style={{
                        borderColor: t.active ? '#22C55E' : '#666',
                        color: t.active ? '#22C55E' : '#888',
                      }}
                    >
                      {t.active ? 'ACTIVE' : 'OFF'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(t)}>EDIT</button>
                      <button
                        className={styles.editBtn}
                        style={{ color: '#EF4444' }}
                        onClick={() => remove(t)}
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                    No product types yet. Run{' '}
                    <code>node scripts/seed-product-types.mjs</code> in the storefront,
                    or add one here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div style={modal.overlay} onClick={() => !saving && setEditing(null)}>
          <div style={modal.panel} onClick={(e) => e.stopPropagation()}>
            <div style={modal.header}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em' }}>
                {editing === 'new' ? 'ADD PRODUCT TYPE' : `EDIT — ${editing.name}`}
              </h2>
              <button style={modal.close} onClick={() => setEditing(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <Field label="Type name">
                  <input
                    style={input}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Hoodie"
                  />
                </Field>
                <Field label="Sort order">
                  <input
                    style={input}
                    inputMode="numeric"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value.replace(/\D/g, '') }))}
                  />
                </Field>
              </div>

              <Field label="Default sizes (comma-separated)">
                <input
                  style={input}
                  value={form.sizes}
                  onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
                  placeholder="S, M, L, XL, XXL   —   or   28, 30, 32   —   or   Free Size"
                />
              </Field>

              {/* Spec template */}
              <Section title="Specification rows" onAdd={() => addPair('specTemplate')}>
                {form.specTemplate.map((row, i) => (
                  <div key={i} style={rowGrid}>
                    <input
                      style={input}
                      value={row.label}
                      onChange={(e) => setPair('specTemplate', i, 'label', e.target.value)}
                      placeholder="Fabric"
                    />
                    <input
                      style={input}
                      value={row.defaultValue}
                      onChange={(e) => setPair('specTemplate', i, 'defaultValue', e.target.value)}
                      placeholder="100% Combed Cotton"
                    />
                    <button style={removeBtn} onClick={() => removePair('specTemplate', i)}>✕</button>
                  </div>
                ))}
              </Section>

              {/* Size chart */}
              <Field label="Size chart columns (comma-separated)">
                <input
                  style={input}
                  value={form.chartColumns}
                  onChange={(e) => setForm((f) => ({ ...f, chartColumns: e.target.value }))}
                  placeholder="Chest, Length, Shoulder"
                />
              </Field>

              {columns.length > 0 && (
                <Section title="Size chart rows" onAdd={addChartRow}>
                  <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${columns.length}, 1fr) 32px`, gap: '6px', marginBottom: '6px' }}>
                    <span style={colHead}>SIZE</span>
                    {columns.map((c) => <span key={c} style={colHead}>{c.toUpperCase()}</span>)}
                    <span />
                  </div>
                  {form.chartRows.map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${columns.length}, 1fr) 32px`, gap: '6px', marginBottom: '6px' }}>
                      <input
                        style={input}
                        value={row.size}
                        onChange={(e) => setChartSize(i, e.target.value)}
                        placeholder="M"
                      />
                      {columns.map((c) => (
                        <input
                          key={c}
                          style={input}
                          value={row.measurements?.[c] || ''}
                          onChange={(e) => setChartCell(i, c, e.target.value)}
                          placeholder="44"
                        />
                      ))}
                      <button style={removeBtn} onClick={() => removeChartRow(i)}>✕</button>
                    </div>
                  ))}
                </Section>
              )}

              <Field label="Chart note">
                <input
                  style={input}
                  value={form.chartNote}
                  onChange={(e) => setForm((f) => ({ ...f, chartNote: e.target.value }))}
                  placeholder="Measurements are of the garment, laid flat, in inches."
                />
              </Field>

              {/* How to measure */}
              <Section title="How to measure" onAdd={() => addPair('measureGuide')}>
                {form.measureGuide.map((row, i) => (
                  <div key={i} style={rowGrid}>
                    <input
                      style={input}
                      value={row.label}
                      onChange={(e) => setPair('measureGuide', i, 'label', e.target.value)}
                      placeholder="Chest"
                    />
                    <input
                      style={input}
                      value={row.defaultValue}
                      onChange={(e) => setPair('measureGuide', i, 'defaultValue', e.target.value)}
                      placeholder="Measure armpit to armpit and double it."
                    />
                    <button style={removeBtn} onClick={() => removePair('measureGuide', i)}>✕</button>
                  </div>
                ))}
              </Section>

              <label style={check}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active — available when adding a product
              </label>

              <button
                onClick={save}
                disabled={saving}
                style={{
                  padding: '12px', background: saving ? '#555' : '#22C55E', color: '#0A0A0A',
                  border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '13px',
                  letterSpacing: '0.08em', cursor: saving ? 'default' : 'pointer',
                }}
              >
                {saving ? 'SAVING…' : 'SAVE TYPE'}
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
        onConfirm={async () => { await confirm?.run?.(); setConfirm(null); }}
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

function Section({ title, onAdd, children }) {
  return (
    <div style={{ border: '1px solid #2A2A2A', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ color: '#888', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {title}
        </span>
        <button
          onClick={onAdd}
          style={{
            background: 'transparent', border: '1px solid #333', borderRadius: '4px',
            color: '#F5C518', fontSize: '11px', fontWeight: 700, padding: '4px 10px', cursor: 'pointer',
          }}
        >
          + ADD ROW
        </button>
      </div>
      {children}
    </div>
  );
}

const input = {
  padding: '9px 11px', background: '#0F0F0F', border: '1px solid #333',
  borderRadius: '4px', color: '#F5F5F5', fontSize: '13px', width: '100%',
};

const rowGrid = {
  display: 'grid', gridTemplateColumns: '1fr 1.6fr 32px', gap: '6px', marginBottom: '6px',
};

const removeBtn = {
  background: 'transparent', border: '1px solid #333', borderRadius: '4px',
  color: '#EF4444', cursor: 'pointer', fontSize: '12px',
};

const colHead = { color: '#666', fontSize: '10px', letterSpacing: '0.08em', paddingLeft: '2px' };

const check = {
  display: 'flex', alignItems: 'center', gap: '8px', color: '#F5F5F5', fontSize: '13px', cursor: 'pointer',
};

const modal = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    padding: '40px 16px', overflowY: 'auto',
  },
  panel: {
    background: '#111', border: '1px solid #333', borderRadius: '10px',
    width: '100%', maxWidth: '760px', padding: '28px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px',
  },
  close: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
};
