'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

const SEGMENTS = ['GYM', 'COFFEE', 'MILLIONAIRE', 'MUSIC', 'GAMER', 'CARS', 'BIKE', 'SUMMER', 'FLORAL', 'SPORTS', 'VALENTINE', 'TYPOGRAPHY', 'RANDOMS'];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Declared before the effect that calls it and memoised on the filters it
  // reads, so the effect cannot capture a stale closure and re-run an
  // outdated query when a filter changes.
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (segmentFilter !== 'all') params.set('segment', segmentFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        // Clearing here rather than in a second effect: the selection is
        // only stale once new rows have actually arrived, and a separate
        // effect setting state synchronously caused a cascading render.
        setSelected(new Set());
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, [segmentFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchProducts();
    })();
    return () => { cancelled = true; };
  }, [fetchProducts]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p._id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const isEdit = !!editProduct;
      const url = isEdit ? `/api/products/${editProduct._id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditProduct(null);
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch {
      alert('Network error');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.segment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Bulk selection ──────────────────────────────────────────
  const allVisibleSelected =
    filteredProducts.length > 0 && filteredProducts.every(p => selected.has(p._id));

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(prev => {
      if (filteredProducts.every(p => prev.has(p._id))) return new Set();
      return new Set(filteredProducts.map(p => p._id));
    });
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        [...selected].map(id => fetch(`/api/products/${id}`, { method: 'DELETE' }))
      );
      setSelected(new Set());
      fetchProducts();
    } catch {
      alert('Bulk delete failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkSetActive = async (isActive) => {
    setBulkBusy(true);
    try {
      await Promise.all(
        [...selected].map(id =>
          fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive }),
          })
        )
      );
      setSelected(new Set());
      fetchProducts();
    } catch {
      alert('Bulk update failed');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1>PRODUCTS</h1>
          <p>Manage store drops and inventory items.</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditProduct(null); setShowForm(true); }}>
          + ADD NEW DROP
        </button>
      </header>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          <select className={styles.select} value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)}>
            <option value="all">All Segments</option>
            {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={bulkBarStyles.bar}>
          <span style={bulkBarStyles.count}>{selected.size} selected</span>
          <div style={bulkBarStyles.actions}>
            <button style={bulkBarStyles.btn} disabled={bulkBusy} onClick={() => bulkSetActive(true)}>ACTIVATE</button>
            <button style={bulkBarStyles.btn} disabled={bulkBusy} onClick={() => bulkSetActive(false)}>DEACTIVATE</button>
            <button style={{ ...bulkBarStyles.btn, ...bulkBarStyles.danger }} disabled={bulkBusy} onClick={bulkDelete}>DELETE</button>
            <button style={bulkBarStyles.clear} disabled={bulkBusy} onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ padding: '40px', color: '#666' }}>Loading products...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all products"
                  />
                </th>
                <th>ITEM</th>
                <th>SEGMENT</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? filteredProducts.map(product => {
                const totalStock = product.sizes?.reduce((acc, curr) => acc + curr.stock, 0) || 0;
                const isInactive = product.isActive === false;

                return (
                  <tr key={product._id} style={isInactive ? { opacity: 0.55 } : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(product._id)}
                        onChange={() => toggleSelect(product._id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td>
                      <div className={styles.itemCell}>
                        <div className={styles.imgWrap}>
                          {product.images?.[0] && (
                            <Image src={product.images[0]} alt={product.name} fill style={{ objectFit: 'cover' }} />
                          )}
                        </div>
                        <div className={styles.itemMeta}>
                          <span className={styles.itemName}>
                            {product.name}
                            {isInactive && <span style={{ marginLeft: 8, fontSize: 10, color: '#EF4444', fontWeight: 700 }}>HIDDEN</span>}
                          </span>
                          <span className={styles.itemStock}>
                            {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.segmentBadge}>{product.segment}</span></td>
                    <td>₹{product.price}</td>
                    <td>{totalStock}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => { setEditProduct(product); setShowForm(true); }}>EDIT</button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(product._id, product.name)}>DELETE</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No products found. Click &quot;+ ADD NEW DROP&quot; to create your first product.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

// ─── Product Form Modal ───────────────────────────────────────

function ProductFormModal({ product, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    productType: product?.productType || '',
    segment: product?.segment || 'GYM',
    price: product?.price || '',
    mrp: product?.mrp || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    highlights: product?.highlights?.length ? product.highlights : [''],
    // Free text now — the enum ['Oversized','Super Oversized'] could not
    // describe a hoodie, a pant or a cap.
    fitType: product?.fitType || '',
    material: product?.material || '',
    careInstructions: product?.careInstructions || '',
    specs: product?.specs?.length ? product.specs : [],
    colors: product?.colors?.join(', ') || 'Black',
    tags: product?.tags?.join(', ') || '',
    images: product?.images || [],
    // Starts empty for a new product: the sizes come from whichever type is
    // chosen, rather than assuming a t-shirt's run.
    sizes: product?.sizes || [],
  });

  const [uploading, setUploading] = useState(false);
  const [types, setTypes] = useState([]);

  /**
   * Adopt a type's template.
   *
   * Everything it writes is a starting point the operator can change —
   * nothing here is enforced later. Existing stock is preserved by size
   * name, so switching type on a product that already has stock does not
   * silently zero it.
   *
   * Declared before the effect that uses it, and as a plain updater, so the
   * effect does not capture a stale closure.
   */
  const applyType = useCallback((type) => {
    if (!type) return;
    setForm((prev) => {
      const bySize = new Map((prev.sizes || []).map((s) => [s.size, s.stock]));
      return {
        ...prev,
        productType: type.name,
        sizes: (type.sizes || []).map((size) => ({ size, stock: bySize.get(size) ?? 0 })),
        // Don't trample spec rows the operator has already filled in.
        specs: prev.specs?.length
          ? prev.specs
          : (type.specTemplate || []).map((s) => ({ label: s.label, value: s.defaultValue || '' })),
      };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/product-types');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const active = (data.types || []).filter((t) => t.active !== false);
        if (cancelled) return;
        setTypes(active);
        // A brand-new product adopts the first type so the form is never
        // in a state with no sizes and no spec rows.
        if (!product && active.length) applyType(active[0]);
      } catch {
        /* the form still works; the operator types sizes by hand */
      }
    })();
    return () => { cancelled = true; };
    // `product` is the modal's own prop and never changes while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on open
  }, [applyType]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSizeStock = (index, stock) => {
    setForm(prev => {
      const newSizes = [...prev.sizes];
      newSizes[index] = { ...newSizes[index], stock: parseInt(stock) || 0 };
      return { ...prev, sizes: newSizes };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, images: [...prev.images, data.url] }));
      } else {
        alert('Upload failed');
      }
    } catch {
      alert('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const sizes = form.sizes
      .map((s) => ({ size: String(s.size || '').trim(), stock: parseInt(s.stock, 10) || 0 }))
      .filter((s) => s.size);

    if (sizes.length === 0) {
      alert('Add at least one size.');
      return;
    }

    onSubmit({
      ...form,
      price: parseFloat(form.price),
      mrp: parseFloat(form.mrp),
      sizes,
      // Blank rows are an artefact of the editor, not data.
      specs: form.specs
        .map((s) => ({ label: String(s.label || '').trim(), value: String(s.value || '').trim() }))
        .filter((s) => s.label && s.value),
      highlights: form.highlights.map((h) => String(h || '').trim()).filter(Boolean),
      colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  // --- sizes: add, rename, remove ---
  const addSize = () =>
    setForm((f) => ({ ...f, sizes: [...f.sizes, { size: '', stock: 0 }] }));

  const setSizeName = (i, value) =>
    setForm((f) => {
      const sizes = [...f.sizes];
      sizes[i] = { ...sizes[i], size: value };
      return { ...f, sizes };
    });

  const removeSize = (i) =>
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }));

  // --- specs ---
  const setSpec = (i, field, value) =>
    setForm((f) => {
      const specs = [...f.specs];
      specs[i] = { ...specs[i], [field]: value };
      return { ...f, specs };
    });

  const addSpec = () =>
    setForm((f) => ({ ...f, specs: [...f.specs, { label: '', value: '' }] }));

  const removeSpec = (i) =>
    setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }));

  // --- highlights ---
  const setHighlight = (i, value) =>
    setForm((f) => {
      const highlights = [...f.highlights];
      highlights[i] = value;
      return { ...f, highlights };
    });

  const addHighlight = () =>
    setForm((f) => ({ ...f, highlights: [...f.highlights, ''] }));

  const removeHighlight = (i) =>
    setForm((f) => ({ ...f, highlights: f.highlights.filter((_, idx) => idx !== i) }));

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2>{product ? 'EDIT DROP' : 'CREATE NEW DROP'}</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.row}>
            <div style={modalStyles.field}>
              <label>Product Name *</label>
              <input value={form.name} onChange={e => handleChange('name', e.target.value)} required style={modalStyles.input} />
            </div>
            <div style={modalStyles.field}>
              <label>Segment *</label>
              <select value={form.segment} onChange={e => handleChange('segment', e.target.value)} style={modalStyles.input}>
                {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={modalStyles.row}>
            <div style={modalStyles.field}>
              <label>Price (₹) *</label>
              <input type="number" value={form.price} onChange={e => handleChange('price', e.target.value)} required style={modalStyles.input} />
            </div>
            <div style={modalStyles.field}>
              <label>MRP (₹) *</label>
              <input type="number" value={form.mrp} onChange={e => handleChange('mrp', e.target.value)} required style={modalStyles.input} />
            </div>
            <div style={modalStyles.field}>
              {/* Free text: the old two-option dropdown was a t-shirt
                  vocabulary a hoodie or a cap could not answer. */}
              <label>Fit</label>
              <input
                value={form.fitType}
                onChange={e => handleChange('fitType', e.target.value)}
                placeholder="Oversized / Regular / Relaxed"
                style={modalStyles.input}
              />
            </div>
          </div>

          {/* Product type — drives the default sizes and spec rows below. */}
          <div style={modalStyles.row}>
            <div style={modalStyles.field}>
              <label>Product Type *</label>
              <select
                value={form.productType}
                onChange={(e) => applyType(types.find((t) => t.name === e.target.value))}
                style={modalStyles.input}
              >
                {types.length === 0 && <option value="">No types defined</option>}
                {types.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
              </select>
              <span style={hint}>
                Sets the starting sizes and specifications — all editable below.
              </span>
            </div>
            <div style={modalStyles.field}>
              <label>Material</label>
              <input
                value={form.material}
                onChange={e => handleChange('material', e.target.value)}
                placeholder="240 GSM Combed Cotton"
                style={modalStyles.input}
              />
              <span style={hint}>
                Shown on the product page. Previously had no field at all.
              </span>
            </div>
          </div>

          <div style={modalStyles.field}>
            <label>Short Description</label>
            <input
              value={form.shortDescription}
              onChange={e => handleChange('shortDescription', e.target.value)}
              maxLength={300}
              placeholder="One line for cards, search results and social previews."
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.field}>
            <label>Description *</label>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} required style={{ ...modalStyles.input, minHeight: '80px', resize: 'vertical' }} />
          </div>

          {/* Highlights */}
          <div style={modalStyles.field}>
            <div style={sectionHead}>
              <label style={{ margin: 0 }}>Highlights</label>
              <button type="button" onClick={addHighlight} style={addRowBtn}>+ ADD</button>
            </div>
            <span style={hint}>Three to five scannable points — most shoppers read only these.</span>
            {form.highlights.map((h, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 32px', gap: '6px', marginTop: '6px' }}>
                <input
                  value={h}
                  onChange={(e) => setHighlight(i, e.target.value)}
                  placeholder="Heavyweight 240 GSM — holds its shape wash after wash"
                  style={modalStyles.input}
                />
                <button type="button" onClick={() => removeHighlight(i)} style={rowRemoveBtn}>✕</button>
              </div>
            ))}
          </div>

          {/* Specifications */}
          <div style={modalStyles.field}>
            <div style={sectionHead}>
              <label style={{ margin: 0 }}>Specifications</label>
              <button type="button" onClick={addSpec} style={addRowBtn}>+ ADD ROW</button>
            </div>
            <span style={hint}>
              Rendered as a table on the product page, and fed to Google&apos;s
              product markup.
            </span>
            {form.specs.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 32px', gap: '6px', marginTop: '6px' }}>
                <input
                  value={s.label}
                  onChange={(e) => setSpec(i, 'label', e.target.value)}
                  placeholder="Fabric"
                  style={modalStyles.input}
                />
                <input
                  value={s.value}
                  onChange={(e) => setSpec(i, 'value', e.target.value)}
                  placeholder="100% Combed Cotton"
                  style={modalStyles.input}
                />
                <button type="button" onClick={() => removeSpec(i)} style={rowRemoveBtn}>✕</button>
              </div>
            ))}
          </div>

          <div style={modalStyles.field}>
            <label>Care Instructions</label>
            <input
              value={form.careInstructions}
              onChange={e => handleChange('careInstructions', e.target.value)}
              placeholder="Machine wash cold, inside out. Do not bleach."
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.row}>
            <div style={modalStyles.field}>
              <label>Colors (comma-separated)</label>
              <input value={form.colors} onChange={e => handleChange('colors', e.target.value)} style={modalStyles.input} />
            </div>
            <div style={modalStyles.field}>
              <label>Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="new, trending, premium" style={modalStyles.input} />
            </div>
          </div>

          {/* Sizes */}
          <div style={modalStyles.field}>
            <div style={sectionHead}>
              <label style={{ margin: 0 }}>Stock by Size</label>
              <button type="button" onClick={addSize} style={addRowBtn}>+ ADD SIZE</button>
            </div>
            <span style={hint}>
              Size names are free text — S/M/L for a tee, 28/30/32 for a pant,
              Free Size for a cap.
            </span>
            {/* Was a fixed five-column S–XXL row. Sizes are editable and
                removable now, keyed by index rather than by name so
                renaming a size does not remount and lose focus. */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              {form.sizes.map((s, i) => (
                <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                  <input
                    value={s.size}
                    onChange={(e) => setSizeName(i, e.target.value)}
                    placeholder="Size"
                    style={{ ...modalStyles.input, width: '74px', textAlign: 'center', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}
                  />
                  <input
                    type="number"
                    min="0"
                    value={s.stock}
                    onChange={e => handleSizeStock(i, e.target.value)}
                    style={{ ...modalStyles.input, width: '74px', textAlign: 'center' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSize(i)}
                    aria-label={`Remove size ${s.size || i + 1}`}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px',
                      borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none',
                      fontSize: '10px', cursor: 'pointer', lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {form.sizes.length === 0 && (
                <span style={{ color: '#666', fontSize: '12px', padding: '10px 0' }}>
                  No sizes yet — pick a product type above, or add one.
                </span>
              )}
            </div>
          </div>

          {/* Images */}
          <div style={modalStyles.field}>
            <label>Product Images</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {form.images.map((url, i) => (
                <div key={i} style={{ position: 'relative', width: '70px', height: '90px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #333' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 2, right: 2, background: '#EF4444', color: '#fff', fontSize: '10px', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            {uploading && <p style={{ color: '#F5C518', fontSize: '12px' }}>Uploading...</p>}
          </div>

          <button type="submit" style={modalStyles.submitBtn}>
            {product ? 'UPDATE DROP' : 'CREATE DROP'}
          </button>
        </form>
      </div>
    </div>
  );
}

const bulkBarStyles = {
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px 16px', margin: '0 0 12px', background: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' },
  count: { fontSize: '13px', fontWeight: 700, color: '#F5F5F5', letterSpacing: '0.05em' },
  actions: { display: 'flex', alignItems: 'center', gap: '8px' },
  btn: { padding: '8px 14px', background: 'transparent', border: '1px solid #333', borderRadius: '4px', color: '#F5F5F5', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer' },
  danger: { borderColor: '#EF4444', color: '#EF4444' },
  clear: { padding: '8px 10px', background: 'transparent', border: 'none', color: '#888', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' },
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px', overflowY: 'auto' },
  modal: { background: '#111', border: '1px solid #333', borderRadius: '8px', width: '100%', maxWidth: '700px', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'flex', gap: '16px' },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { padding: '10px 12px', background: '#1A1A1A', border: '1px solid #333', borderRadius: '4px', color: '#F5F5F5', fontSize: '13px' },
  submitBtn: { padding: '14px', background: '#F5F5F5', color: '#0A0A0A', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '14px', letterSpacing: '0.1em', cursor: 'pointer', marginTop: '8px' },
};

const hint = {
  display: 'block',
  color: '#666',
  fontSize: '11px',
  lineHeight: 1.5,
  marginTop: '4px',
};

const sectionHead = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const addRowBtn = {
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#F5C518',
  fontSize: '11px',
  fontWeight: 700,
  padding: '4px 10px',
  cursor: 'pointer',
};

const rowRemoveBtn = {
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#EF4444',
  cursor: 'pointer',
  fontSize: '12px',
};
