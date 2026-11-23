'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../products/page.module.css';
import ConfirmDialog from '@/components/ConfirmDialog';

const SEGMENTS = ['GYM', 'COFFEE', 'MILLIONAIRE', 'MUSIC', 'GAMER', 'CARS', 'BIKE', 'SUMMER', 'FLORAL', 'SPORTS', 'VALENTINE', 'TYPOGRAPHY', 'RANDOMS'];

const SOURCES = [
  { value: 'tag', label: 'By tag', hint: 'Tag a product and it appears here. Stock stays automatic — the safest choice.' },
  { value: 'segment', label: 'By segment', hint: 'Everything in one world, newest first.' },
  { value: 'newest', label: 'Newest drops', hint: 'The most recent products, whatever they are.' },
  { value: 'manual', label: 'Hand-picked', hint: 'Exact control. Needs revisiting — picks go out of stock.' },
];

const EMPTY = {
  title: '',
  eyebrow: '',
  subtitle: '',
  source: 'tag',
  tag: '',
  segment: 'GYM',
  productSlugs: [],
  limit: 8,
  layout: 'grid',
  linkLabel: '',
  linkHref: '',
  sortOrder: 0,
  active: true,
  startsAt: '',
  endsAt: '',
};

/** A Date from the API renders in a date input only as yyyy-mm-dd. */
const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function AdminHomepage() {
  const [sections, setSections] = useState([]);
  const [tags, setTags] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // section object, or 'new'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [secRes, prodRes] = await Promise.all([
        fetch('/api/home-sections'),
        fetch('/api/products'),
      ]);
      if (secRes.ok) setSections((await secRes.json()).sections || []);
      if (prodRes.ok) {
        const list = (await prodRes.json()).products || [];
        setProducts(list);
        // Offer the tags that actually exist, so a section can't be built
        // on a tag no product carries.
        setTags([...new Set(list.flatMap((p) => p.tags || []))].sort());
      }
    } catch (err) {
      console.error('Fetch homepage data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await fetchAll(); })();
    return () => { cancelled = true; };
  }, [fetchAll]);

  const openNew = () => {
    setForm({ ...EMPTY, sortOrder: sections.length + 1 });
    setEditing('new');
  };

  const openEdit = (s) => {
    setForm({
      title: s.title || '',
      eyebrow: s.eyebrow || '',
      subtitle: s.subtitle || '',
      source: s.source || 'tag',
      tag: s.tag || '',
      segment: s.segment || 'GYM',
      productSlugs: s.productSlugs || [],
      limit: s.limit ?? 8,
      layout: s.layout || 'grid',
      linkLabel: s.linkLabel || '',
      linkHref: s.linkHref || '',
      sortOrder: s.sortOrder ?? 0,
      active: s.active !== false,
      startsAt: toDateInput(s.startsAt),
      endsAt: toDateInput(s.endsAt),
    });
    setEditing(s);
  };

  const save = async () => {
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const res = await fetch(isNew ? '/api/home-sections' : `/api/home-sections/${editing._id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to save'); return; }
      setEditing(null);
      fetchAll();
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      const res = await fetch(`/api/home-sections/${s._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !s.active }),
      });
      if (!res.ok) { alert('Failed to update'); return; }
      fetchAll();
    } catch { alert('Network error'); }
  };

  /** Moving a section is a swap of sortOrder with its neighbour. */
  const move = async (s, dir) => {
    const ordered = [...sections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const i = ordered.findIndex((x) => x._id === s._id);
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;

    const a = ordered[i];
    const b = ordered[j];
    try {
      await Promise.all([
        fetch(`/api/home-sections/${a._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...a, sortOrder: b.sortOrder ?? j }),
        }),
        fetch(`/api/home-sections/${b._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...b, sortOrder: a.sortOrder ?? i }),
        }),
      ]);
      fetchAll();
    } catch { alert('Network error'); }
  };

  const remove = (s) => {
    setConfirm({
      title: 'Delete this section?',
      message: s.title,
      effects: [
        'It will stop appearing on the home page immediately.',
        'No products are affected — only this strip is removed.',
        'Switching it off instead keeps the settings for later.',
      ],
      danger: true,
      confirmLabel: 'Delete',
      run: async () => {
        const res = await fetch(`/api/home-sections/${s._id}`, { method: 'DELETE' });
        if (!res.ok) { alert('Failed to delete'); return; }
        fetchAll();
      },
    });
  };

  const toggleSlug = (slug) =>
    setForm((f) => ({
      ...f,
      productSlugs: f.productSlugs.includes(slug)
        ? f.productSlugs.filter((s) => s !== slug)
        : [...f.productSlugs, slug],
    }));

  const describe = (s) => {
    if (s.source === 'tag') return `tag: ${s.tag}`;
    if (s.source === 'segment') return `segment: ${s.segment}`;
    if (s.source === 'manual') return `${s.productSlugs?.length || 0} hand-picked`;
    return 'newest drops';
  };

  const sourceHint = SOURCES.find((s) => s.value === form.source)?.hint;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>HOME PAGE SECTIONS</h1>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Product strips on the home page — Trending, a seasonal edit, anything
            you name. They render in the order below, between Latest Drop and the
            segment grid.
          </p>
        </div>
        <button className={styles.addBtn} onClick={openNew}>+ ADD SECTION</button>
      </div>

      {loading ? (
        <p style={{ color: '#666', padding: '40px', textAlign: 'center' }}>Loading…</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ORDER</th>
                <th>SECTION</th>
                <th>PRODUCTS</th>
                <th>LAYOUT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sections.length > 0 ? sections.map((s, i) => (
                <tr key={s._id} style={{ opacity: s.active ? 1 : 0.45 }}>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button className={styles.editBtn} onClick={() => move(s, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button className={styles.editBtn} onClick={() => move(s, 1)} disabled={i === sections.length - 1} aria-label="Move down">↓</button>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{s.title}</div>
                    {s.eyebrow && <div style={{ color: '#666', fontSize: '11px' }}>{s.eyebrow}</div>}
                  </td>
                  <td style={{ color: '#A0A0A0', fontSize: '12px' }}>
                    {describe(s)} · max {s.limit}
                  </td>
                  <td style={{ color: '#A0A0A0' }}>{s.layout}</td>
                  <td>
                    <span
                      className={styles.segmentBadge}
                      style={{
                        borderColor: s.active ? '#22C55E' : '#666',
                        color: s.active ? '#22C55E' : '#888',
                      }}
                    >
                      {s.active ? 'LIVE' : 'OFF'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(s)}>EDIT</button>
                      <button className={styles.editBtn} onClick={() => toggleActive(s)}>
                        {s.active ? 'TURN OFF' : 'TURN ON'}
                      </button>
                      <button className={styles.editBtn} style={{ color: '#EF4444' }} onClick={() => remove(s)}>DELETE</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                    No sections yet. The home page shows its built-in blocks only.
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
                {editing === 'new' ? 'ADD SECTION' : `EDIT — ${editing.title}`}
              </h2>
              <button style={modal.close} onClick={() => setEditing(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Title" hint="Shown as the section heading.">
                <input style={input} value={form.title} placeholder="TRENDING NOW"
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Eyebrow (optional)" hint="Small label above the title.">
                  <input style={input} value={form.eyebrow} placeholder="MOVING FAST"
                    onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} />
                </Field>
                <Field label="Max products">
                  <input style={input} inputMode="numeric" value={form.limit}
                    onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value.replace(/\D/g, '') }))} />
                </Field>
              </div>

              <Field label="Subtitle (optional)">
                <input style={input} value={form.subtitle} placeholder="What everyone is reaching for this week."
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
              </Field>

              {/* How products are chosen */}
              <Field label="Pick products by" hint={sourceHint}>
                <select style={input} value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>
                  {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>

              {form.source === 'tag' && (
                <Field label="Tag" hint="Only tags already on a product are listed.">
                  <select style={input} value={form.tag}
                    onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}>
                    <option value="">Choose a tag…</option>
                    {tags.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              )}

              {form.source === 'segment' && (
                <Field label="Segment">
                  <select style={input} value={form.segment}
                    onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}>
                    {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              )}

              {form.source === 'manual' && (
                <Field label={`Products (${form.productSlugs.length} selected)`}
                       hint="Order follows the order you tick them.">
                  <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #2A2A2A', borderRadius: '6px', padding: '8px' }}>
                    {products.map((p) => (
                      <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.productSlugs.includes(p.slug)}
                          onChange={() => toggleSlug(p.slug)} />
                        <span style={{ color: '#F5F5F5' }}>{p.name}</span>
                        <span style={{ color: '#666', fontSize: '11px' }}>₹{p.price}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              )}

              <Field label="Layout">
                <select style={input} value={form.layout}
                  onChange={(e) => setForm((f) => ({ ...f, layout: e.target.value }))}>
                  <option value="grid">Grid — wraps onto rows</option>
                  <option value="carousel">Carousel — scrolls sideways</option>
                </select>
              </Field>

              {/* Optional "view all" link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '12px' }}>
                <Field label="Link label (optional)">
                  <input style={input} value={form.linkLabel} placeholder="VIEW ALL"
                    onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))} />
                </Field>
                <Field label="Link destination" hint="Where the button goes. An ad can point straight here.">
                  <input style={input} value={form.linkHref} placeholder="/shop?tag=trending"
                    onChange={(e) => setForm((f) => ({ ...f, linkHref: e.target.value }))} />
                </Field>
              </div>

              {/* Optional schedule */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Starts (optional)" hint="Blank = live now.">
                  <input style={input} type="date" value={form.startsAt}
                    onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
                </Field>
                <Field label="Ends (optional)" hint="Blank = no end. Retires itself.">
                  <input style={input} type="date" value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
                </Field>
              </div>

              <label style={check}>
                <input type="checkbox" checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Live — visible on the home page
              </label>

              <button onClick={save} disabled={saving} style={{
                minHeight: '44px', padding: '12px', background: saving ? '#555' : '#22C55E',
                color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 800,
                fontSize: '13px', letterSpacing: '0.08em', cursor: saving ? 'default' : 'pointer',
              }}>
                {saving ? 'SAVING…' : 'SAVE SECTION'}
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
