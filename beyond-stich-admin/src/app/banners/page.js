'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../products/page.module.css';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadState from '@/components/LoadState';
import fetchJson from '@/lib/fetchJson';

const PLACEMENTS = [
  { value: 'home-hero', label: 'Home page hero', hint: 'The big carousel at the top of the home page.' },
  { value: 'shop-hero', label: 'Shop page banner', hint: 'The strip above the product grid on /shop.' },
];

const EMPTY = {
  placement: 'home-hero',
  name: '',
  desktopImage: '',
  mobileImage: '',
  badge: '',
  headline: '',
  subheadline: '',
  ctaLabel: 'SHOP NOW',
  ctaHref: '/shop',
  code: '',
  accent: '',
  sortOrder: 0,
  active: true,
  startsAt: '',
  endsAt: '',
};

const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placement, setPlacement] = useState('home-hero');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [loadError, setLoadError] = useState('');

  const fetchBanners = useCallback(async () => {
    setLoadError('');
    try {
      // fetchJson throws on a non-2xx, so an outage can no longer arrive
      // here looking like "no slides configured".
      const data = await fetchJson('/api/banners');
      setBanners(data.banners || []);
    } catch (err) {
      console.error('Fetch banners error:', err);
      setLoadError(err.message);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await fetchBanners(); })();
    return () => { cancelled = true; };
  }, [fetchBanners]);

  const shown = banners.filter((b) => b.placement === placement);

  const openNew = () => {
    setForm({ ...EMPTY, placement, sortOrder: shown.length + 1 });
    setEditing('new');
  };

  const openEdit = (b) => {
    setForm({
      placement: b.placement || 'home-hero',
      name: b.name || '',
      desktopImage: b.desktopImage || '',
      mobileImage: b.mobileImage || '',
      badge: b.badge || '',
      headline: b.headline || '',
      subheadline: b.subheadline || '',
      ctaLabel: b.ctaLabel || '',
      ctaHref: b.ctaHref || '',
      code: b.code || '',
      accent: b.accent || '',
      sortOrder: b.sortOrder ?? 0,
      active: b.active !== false,
      startsAt: toDateInput(b.startsAt),
      endsAt: toDateInput(b.endsAt),
    });
    setEditing(b);
  };

  /** Uploads straight to Cloudinary and stores the returned URL. */
  const upload = async (file, field) => {
    if (!file) return;
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('purpose', field === 'desktopImage' ? 'banner-desktop' : 'banner-mobile');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Upload failed'); return; }
      setForm((f) => ({ ...f, [field]: data.url }));
    } catch {
      alert('Upload failed');
    } finally {
      setUploading('');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const res = await fetch(isNew ? '/api/banners' : `/api/banners/${editing._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to save'); return; }
      setEditing(null);
      fetchBanners();
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b) => {
    // The hero needs at least one live slide, or the home page falls back to
    // the built-in slides and the admin looks broken.
    const liveInPlacement = banners.filter((x) => x.placement === b.placement && x.active).length;
    if (b.active && liveInPlacement <= 1) {
      alert('This is the only live slide for this spot. Add another before switching it off.');
      return;
    }
    try {
      const res = await fetch(`/api/banners/${b._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !b.active }),
      });
      if (!res.ok) { alert('Failed to update'); return; }
      fetchBanners();
    } catch { alert('Network error'); }
  };

  const move = async (b, dir) => {
    const ordered = [...shown].sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0));
    const i = ordered.findIndex((x) => x._id === b._id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;

    const a = ordered[i];
    const c = ordered[j];
    try {
      await Promise.all([
        fetch(`/api/banners/${a._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...a, sortOrder: c.sortOrder ?? j }),
        }),
        fetch(`/api/banners/${c._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...c, sortOrder: a.sortOrder ?? i }),
        }),
      ]);
      fetchBanners();
    } catch { alert('Network error'); }
  };

  const remove = (b) => {
    setConfirm({
      title: 'Delete this slide?',
      message: b.name || b.headline,
      effects: [
        'It disappears from the carousel immediately.',
        'The uploaded image stays in Cloudinary.',
        'Switching it off instead keeps it ready to reuse.',
      ],
      danger: true,
      confirmLabel: 'Delete',
      run: async () => {
        const res = await fetch(`/api/banners/${b._id}`, { method: 'DELETE' });
        if (!res.ok) { alert('Failed to delete'); return; }
        fetchBanners();
      },
    });
  };

  const placementHint = PLACEMENTS.find((p) => p.value === placement)?.hint;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>BANNERS</h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            {placementHint} Slides play in the order below.
          </p>
        </div>
        <button className={styles.addBtn} onClick={openNew}>+ ADD SLIDE</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {PLACEMENTS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPlacement(p.value)}
            style={{
              minHeight: '44px', padding: '10px 16px', borderRadius: '6px',
              fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer',
              background: placement === p.value ? '#F5F5F5' : 'transparent',
              color: placement === p.value ? '#0A0A0A' : '#888',
              border: `1px solid ${placement === p.value ? '#F5F5F5' : '#333'}`,
            }}
          >
            {p.label.toUpperCase()}
          </button>
        ))}
      </div>

      {loading || loadError || shown.length === 0 ? (
        <LoadState
          loading={loading}
          error={loadError}
          onRetry={fetchBanners}
          empty={shown.length === 0}
          loadingText="Loading slides…"
          emptyText="No slides here yet — the site shows its built-in banners."
        />
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {shown.map((b, i) => (
            <div key={b._id} style={{
              display: 'flex', gap: '16px', padding: '14px', alignItems: 'center',
              background: '#111', border: '1px solid #2A2A2A', borderRadius: '10px',
              opacity: b.active ? 1 : 0.45, flexWrap: 'wrap',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.desktopImage}
                alt=""
                style={{ width: '140px', height: '70px', objectFit: 'cover', borderRadius: '6px', background: '#000', flexShrink: 0 }}
              />

              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px' }}>{b.headline}</span>
                  <span className={styles.segmentBadge} style={{
                    borderColor: b.active ? '#22C55E' : '#666',
                    color: b.active ? '#22C55E' : '#888',
                  }}>
                    {b.active ? 'LIVE' : 'OFF'}
                  </span>
                  {!b.mobileImage && (
                    <span className={styles.segmentBadge} style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
                      NO MOBILE IMAGE
                    </span>
                  )}
                </div>
                {b.subheadline && (
                  <div style={{ color: '#A0A0A0', fontSize: '12px', marginTop: '4px' }}>{b.subheadline}</div>
                )}
                <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                  {b.ctaLabel ? `${b.ctaLabel} → ${b.ctaHref}` : 'No button'}
                  {b.code ? ` · code ${b.code}` : ''}
                </div>
              </div>

              <div className={styles.actions} style={{ flexShrink: 0 }}>
                <button className={styles.editBtn} onClick={() => move(b, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className={styles.editBtn} onClick={() => move(b, 1)} disabled={i === shown.length - 1} aria-label="Move down">↓</button>
                <button className={styles.editBtn} onClick={() => openEdit(b)}>EDIT</button>
                <button className={styles.editBtn} onClick={() => toggleActive(b)}>
                  {b.active ? 'TURN OFF' : 'TURN ON'}
                </button>
                <button className={styles.editBtn} style={{ color: '#EF4444' }} onClick={() => remove(b)}>DELETE</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div style={modal.overlay} onClick={() => !saving && setEditing(null)}>
          <div style={modal.panel} onClick={(e) => e.stopPropagation()}>
            <div style={modal.header}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em' }}>
                {editing === 'new' ? 'ADD SLIDE' : 'EDIT SLIDE'}
              </h2>
              <button style={modal.close} onClick={() => setEditing(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Where it appears">
                <select style={input} value={form.placement}
                  onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}>
                  {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>

              <Field label="Internal name (optional)" hint="Only you see this — helps tell slides apart.">
                <input style={input} value={form.name} placeholder="Nov sale slide 1"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>

              <ImageField
                label="Desktop image"
                hint="Wide. 2400×1000 or similar. Required."
                value={form.desktopImage}
                busy={uploading === 'desktopImage'}
                onFile={(file) => upload(file, 'desktopImage')}
                onClear={() => setForm((f) => ({ ...f, desktopImage: '' }))}
              />

              <ImageField
                label="Mobile image (optional)"
                hint="Taller crop for phones, around 1200×1500. Without it, phones use the desktop image and the subject can get cut off."
                value={form.mobileImage}
                busy={uploading === 'mobileImage'}
                onFile={(file) => upload(file, 'mobileImage')}
                onClear={() => setForm((f) => ({ ...f, mobileImage: '' }))}
              />

              <Field label="Badge (optional)" hint="Small pill above the headline.">
                <input style={input} value={form.badge} placeholder="NEW DROP"
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
              </Field>

              <Field label="Headline">
                <input style={input} value={form.headline} placeholder="BUILT BEYOND THE ORDINARY"
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
              </Field>

              <Field label="Subheadline (optional)">
                <input style={input} value={form.subheadline}
                  onChange={(e) => setForm((f) => ({ ...f, subheadline: e.target.value }))} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '12px' }}>
                <Field label="Button label">
                  <input style={input} value={form.ctaLabel} placeholder="SHOP NOW"
                    onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} />
                </Field>
                <Field label="Button destination" hint="Any path on the site, e.g. /shop?tag=trending">
                  <input style={input} value={form.ctaHref} placeholder="/shop"
                    onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} />
                </Field>
              </div>

              <Field
                label="Coupon code shown (optional)"
                hint="Checked against your coupons when you save, so a slide can never advertise a code that does not work."
              >
                <input style={input} value={form.code} placeholder="WELCOME10"
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </Field>

              <Field
                label="Accent colour (optional)"
                hint="Tints the overlay and the button on the shop banner. Blank uses the brand gold."
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.accent || '#C6A14A'}
                    onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value.toUpperCase() }))}
                    style={{ width: '56px', minHeight: '44px', background: '#0F0F0F', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
                  />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Starts (optional)" hint="Blank = live now.">
                  <input style={input} type="date" value={form.startsAt}
                    onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
                </Field>
                <Field label="Ends (optional)" hint="Blank = no end.">
                  <input style={input} type="date" value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
                </Field>
              </div>

              <label style={check}>
                <input type="checkbox" checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Live — showing on the site
              </label>

              <button onClick={save} disabled={saving || Boolean(uploading)} style={{
                minHeight: '44px', padding: '12px',
                background: saving || uploading ? '#555' : '#22C55E',
                color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 800,
                fontSize: '13px', letterSpacing: '0.08em',
                cursor: saving || uploading ? 'default' : 'pointer',
              }}>
                {saving ? 'SAVING…' : uploading ? 'WAIT FOR UPLOAD…' : 'SAVE SLIDE'}
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

function ImageField({ label, hint, value, busy, onFile, onClear }) {
  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {value && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" style={{ width: '160px', height: '80px', objectFit: 'cover', borderRadius: '6px', background: '#000' }} />
            <button onClick={onClear} style={{
              minHeight: '44px', padding: '8px 14px', background: 'transparent',
              border: '1px solid #333', borderRadius: '6px', color: '#EF4444',
              fontSize: '12px', cursor: 'pointer',
            }}>REMOVE</button>
          </>
        )}
        <label style={{
          minHeight: '44px', display: 'inline-flex', alignItems: 'center', padding: '10px 16px',
          background: '#0F0F0F', border: '1px dashed #444', borderRadius: '6px',
          color: busy ? '#666' : '#F5F5F5', fontSize: '12px', cursor: busy ? 'default' : 'pointer',
        }}>
          {busy ? 'UPLOADING…' : value ? 'REPLACE IMAGE' : 'UPLOAD IMAGE'}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            style={{ display: 'none' }}
            onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }}
          />
        </label>
      </div>
    </Field>
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
  fontSize: '13px', width: '100%',
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
