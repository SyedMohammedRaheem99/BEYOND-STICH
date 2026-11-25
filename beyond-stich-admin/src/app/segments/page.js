'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../products/page.module.css';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadState from '@/components/LoadState';
import fetchJson from '@/lib/fetchJson';

const EMPTY = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  longDescription: '',
  accent: '',
  icon: '',
  image: '',
  sortOrder: 0,
  active: true,
  showInGrid: true,
};

export default function AdminSegments() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchSegments = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchJson('/api/segments');
      setSegments(data.segments || []);
    } catch (err) {
      console.error('Fetch segments error:', err);
      setLoadError(err.message);
      setSegments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await fetchSegments(); })();
    return () => { cancelled = true; };
  }, [fetchSegments]);

  const openNew = () => {
    setForm({ ...EMPTY, sortOrder: segments.length + 1 });
    setEditing('new');
  };

  const openEdit = (s) => {
    setForm({
      name: s.name || '',
      slug: s.slug || '',
      tagline: s.tagline || '',
      description: s.description || '',
      longDescription: s.longDescription || '',
      accent: s.accent || '',
      icon: s.icon || '',
      image: s.image || '',
      sortOrder: s.sortOrder ?? 0,
      active: s.active !== false,
      showInGrid: s.showInGrid !== false,
    });
    setEditing(s);
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('purpose', 'banner-desktop');
      const data = await fetchJson('/api/upload', { method: 'POST', body: fd });
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const isNew = editing === 'new';

    // Renaming moves every product in this world. Say so before it happens
    // rather than reporting it afterwards.
    if (!isNew && form.name !== editing.name && editing.productCount > 0) {
      const ok = window.confirm(
        `Renaming ${editing.name} to ${form.name} will also move its ` +
        `${editing.productCount} product${editing.productCount === 1 ? '' : 's'} ` +
        `across, so nothing is lost.\n\nContinue?`
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const data = await fetchJson(
        isNew ? '/api/segments' : `/api/segments/${editing._id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      if (data.movedCount) {
        alert(`Saved. ${data.movedCount} product(s) moved to ${form.name}.`);
      }
      setEditing(null);
      fetchSegments();
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (s, field) => {
    try {
      await fetchJson(`/api/segments/${s._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !s[field] }),
      });
      fetchSegments();
    } catch (err) {
      alert(err.message || 'Failed to update');
    }
  };

  const move = async (s, dir) => {
    const ordered = [...segments].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const i = ordered.findIndex((x) => x._id === s._id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;

    const a = ordered[i];
    const b = ordered[j];
    try {
      await Promise.all([
        fetchJson(`/api/segments/${a._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...a, sortOrder: b.sortOrder ?? j }),
        }),
        fetchJson(`/api/segments/${b._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...b, sortOrder: a.sortOrder ?? i }),
        }),
      ]);
      fetchSegments();
    } catch (err) {
      alert(err.message || 'Failed to reorder');
    }
  };

  const remove = (s) => {
    setConfirm({
      title: `Delete ${s.name}?`,
      message: s.productCount > 0
        ? `${s.name} still holds ${s.productCount} product(s).`
        : s.tagline,
      effects: [
        'Its page, menu entry and home page tile all disappear.',
        s.productCount > 0
          ? 'This will be refused while products still live here.'
          : 'No products are affected — this world is empty.',
        'Switching it off instead keeps everything and just hides it.',
      ],
      danger: true,
      confirmLabel: 'Delete',
      run: async () => {
        try {
          await fetchJson(`/api/segments/${s._id}`, { method: 'DELETE' });
          fetchSegments();
        } catch (err) {
          alert(err.message || 'Failed to delete');
        }
      },
    });
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>SEGMENTS</h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            The worlds products live in. These drive the home page grid, the
            menu, the footer, shop filters and each world&apos;s own page.
          </p>
        </div>
        <button className={styles.addBtn} onClick={openNew}>+ ADD SEGMENT</button>
      </div>

      {loading || loadError || segments.length === 0 ? (
        <LoadState
          loading={loading}
          error={loadError}
          onRetry={fetchSegments}
          empty={segments.length === 0}
          loadingText="Loading segments…"
          emptyText="No segments yet. The site falls back to its built-in list."
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ORDER</th>
                <th>SEGMENT</th>
                <th>URL</th>
                <th>PRODUCTS</th>
                <th>ON GRID</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s, i) => (
                <tr key={s._id} style={{ opacity: s.active ? 1 : 0.45 }}>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className={styles.editBtn} onClick={() => move(s, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button className={styles.editBtn} onClick={() => move(s, 1)} disabled={i === segments.length - 1} aria-label="Move down">↓</button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {s.accent && (
                        <span style={{
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: s.accent, flexShrink: 0,
                        }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        {s.tagline && <div style={{ color: '#666', fontSize: '11px' }}>{s.tagline}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#A0A0A0', fontSize: '12px' }}>/segment/{s.slug}</td>
                  <td style={{ color: s.productCount ? '#F5F5F5' : '#666' }}>{s.productCount}</td>
                  <td>
                    <span
                      className={styles.segmentBadge}
                      style={{
                        borderColor: s.showInGrid ? '#3B82F6' : '#666',
                        color: s.showInGrid ? '#3B82F6' : '#888',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggle(s, 'showInGrid')}
                      title="Click to toggle"
                    >
                      {s.showInGrid ? 'SHOWN' : 'HIDDEN'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={styles.segmentBadge}
                      style={{
                        borderColor: s.active ? '#22C55E' : '#EF4444',
                        color: s.active ? '#22C55E' : '#EF4444',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggle(s, 'active')}
                      title="Click to toggle"
                    >
                      {s.active ? 'LIVE' : 'OFF'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(s)}>EDIT</button>
                      <button className={styles.editBtn} style={{ color: '#EF4444' }} onClick={() => remove(s)}>DELETE</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div style={modal.overlay} onClick={() => !saving && setEditing(null)}>
          <div style={modal.panel} onClick={(e) => e.stopPropagation()}>
            <div style={modal.header}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em' }}>
                {editing === 'new' ? 'ADD SEGMENT' : `EDIT — ${editing.name}`}
              </h2>
              <button style={modal.close} onClick={() => setEditing(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Name" hint="Shown everywhere. Stored on each product.">
                  <input style={input} value={form.name} placeholder="STREETWEAR"
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))} />
                </Field>
                <Field label="URL" hint="Leave blank to build it from the name.">
                  <input style={input} value={form.slug} placeholder="streetwear"
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} />
                </Field>
              </div>

              {editing !== 'new' && editing.productCount > 0 && form.name !== editing.name && (
                <p style={{ color: '#F59E0B', fontSize: '12px', lineHeight: 1.5 }}>
                  Renaming will also move {editing.productCount} product(s) to the
                  new name, so nothing is lost.
                </p>
              )}

              <Field label="Tagline" hint="One line, shown on the tile.">
                <input style={input} value={form.tagline} placeholder="Grind never stops."
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
              </Field>

              <Field label="Short description">
                <input style={input} value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </Field>

              <Field label="Long description" hint="Shown on the world's own page. This is real SEO copy — a few sentences beats one line.">
                <textarea style={{ ...input, minHeight: '120px', resize: 'vertical' }}
                  value={form.longDescription}
                  onChange={(e) => setForm((f) => ({ ...f, longDescription: e.target.value }))} />
              </Field>

              <Field label="Accent colour" hint="Blank uses the brand gold — which is usually the better look away from GAMER.">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={form.accent || '#C6A14A'}
                    onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value.toUpperCase() }))}
                    style={{ width: '56px', minHeight: '44px', background: '#0F0F0F', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }} />
                  <input style={{ ...input, flex: 1 }} value={form.accent} placeholder="#F5C518"
                    onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value.toUpperCase() }))} />
                  {form.accent && (
                    <button onClick={() => setForm((f) => ({ ...f, accent: '' }))} style={{
                      minHeight: '44px', padding: '8px 12px', background: 'transparent',
                      border: '1px solid #333', borderRadius: '6px', color: '#888',
                      fontSize: '11px', cursor: 'pointer',
                    }}>CLEAR</button>
                  )}
                </div>
              </Field>

              <Field label="Tile image (optional)">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {form.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image} alt="" style={{ width: '140px', height: '70px', objectFit: 'cover', borderRadius: '6px', background: '#000' }} />
                  )}
                  <label style={{
                    minHeight: '44px', display: 'inline-flex', alignItems: 'center',
                    padding: '10px 16px', background: '#0F0F0F', border: '1px dashed #444',
                    borderRadius: '6px', color: uploading ? '#666' : '#F5F5F5',
                    fontSize: '12px', cursor: uploading ? 'default' : 'pointer',
                  }}>
                    {uploading ? 'UPLOADING…' : form.image ? 'REPLACE' : 'UPLOAD'}
                    <input type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }}
                      onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                </div>
              </Field>

              <label style={check}>
                <input type="checkbox" checked={form.showInGrid}
                  onChange={(e) => setForm((f) => ({ ...f, showInGrid: e.target.checked }))} />
                Show on the home page grid
              </label>

              <label style={check}>
                <input type="checkbox" checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Live — visible across the site
              </label>

              <button onClick={save} disabled={saving || uploading} style={{
                minHeight: '44px', padding: '12px',
                background: saving || uploading ? '#555' : '#22C55E',
                color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 800,
                fontSize: '13px', letterSpacing: '0.08em',
                cursor: saving || uploading ? 'default' : 'pointer',
              }}>
                {saving ? 'SAVING…' : 'SAVE SEGMENT'}
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

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: '#888', fontSize: '11px', letterSpacing: '0.06em' }}>{label}</label>
      {children}
      {hint && <span style={{ color: '#666', fontSize: '11px', lineHeight: 1.5 }}>{hint}</span>}
    </div>
  );
}

const input = {
  minHeight: '44px', padding: '10px 12px', background: '#0F0F0F',
  border: '1px solid #333', borderRadius: '4px', color: '#F5F5F5',
  fontSize: '13px', width: '100%', fontFamily: 'inherit',
};

const check = {
  display: 'flex', alignItems: 'center', gap: '8px',
  color: '#F5F5F5', fontSize: '13px', cursor: 'pointer', minHeight: '44px',
};

const modal = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    padding: '40px 16px', overflowY: 'auto',
  },
  panel: {
    background: '#111', border: '1px solid #333', borderRadius: '10px',
    width: '100%', maxWidth: '620px', padding: '28px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px',
  },
  close: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer', minHeight: '44px', minWidth: '44px' },
};
