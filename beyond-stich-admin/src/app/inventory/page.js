'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../products/page.module.css';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');
  const [editingCell, setEditingCell] = useState(null); // { productId, sizeIndex }
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        // Sort by total stock ascending (lowest first)
        const sorted = data.products
          .map(p => ({
            ...p,
            totalStock: p.sizes?.reduce((acc, s) => acc + s.stock, 0) || 0,
          }))
          .sort((a, b) => a.totalStock - b.totalStock);
        setProducts(sorted);
      }
    } catch (err) {
      console.error('Fetch inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId, sizes) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sizes }),
      });

      if (res.ok) {
        fetchProducts(); // Refresh
      } else {
        alert('Failed to update stock');
      }
    } catch {
      alert('Network error');
    }

    setEditingCell(null);
  };

  const startEditing = (productId, sizeIndex, currentStock) => {
    setEditingCell({ productId, sizeIndex });
    setEditValue(String(currentStock));
  };

  const commitEdit = (product) => {
    const newSizes = product.sizes.map((s, i) => ({
      ...s,
      stock: i === editingCell.sizeIndex ? (parseInt(editValue) || 0) : s.stock,
    }));
    handleStockUpdate(product._id, newSizes);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Segment', 'S', 'M', 'L', 'XL', 'XXL', 'Total', 'Status'];
    const rows = products.map(p => {
      const getStock = (size) => p.sizes?.find(s => s.size === size)?.stock ?? 0;
      const status = p.totalStock === 0 ? 'OUT OF STOCK' : p.totalStock < 10 ? 'LOW STOCK' : 'HEALTHY';
      return [p.name, p.segment, getStock('S'), getStock('M'), getStock('L'), getStock('XL'), getStock('XXL'), p.totalStock, status];
    });

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beyond-stich-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter
  let filtered = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.segment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (alertFilter === 'critical') {
    filtered = filtered.filter(p => p.totalStock <= 5);
  } else if (alertFilter === 'low') {
    filtered = filtered.filter(p => p.totalStock > 5 && p.totalStock <= 20);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1>INVENTORY</h1>
          <p>Real-time stock levels and low-stock alerts. Click any stock cell to edit.</p>
        </div>
        <button className={styles.addBtn} style={{ background: '#EF4444' }} onClick={exportCSV}>
          EXPORT CSV
        </button>
      </header>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          <select className={styles.select} value={alertFilter} onChange={e => setAlertFilter(e.target.value)}>
            <option value="all">All Alerts</option>
            <option value="critical">Critical (0-5)</option>
            <option value="low">Low (6-20)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ padding: '40px', color: '#666' }}>Loading inventory...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ITEM</th>
                <th>SEGMENT</th>
                <th>S</th>
                <th>M</th>
                <th>L</th>
                <th>XL</th>
                <th>XXL</th>
                <th>TOTAL</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(product => {
                const renderSizeCell = (sizeName, sizeIndex) => {
                  const s = product.sizes?.find((sz, i) => sz.size === sizeName);
                  const idx = product.sizes?.findIndex(sz => sz.size === sizeName);
                  if (!s) return <td>-</td>;

                  const isEditing = editingCell?.productId === product._id && editingCell?.sizeIndex === idx;

                  if (isEditing) {
                    return (
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(product)}
                          onKeyDown={e => e.key === 'Enter' && commitEdit(product)}
                          autoFocus
                          style={{
                            width: '50px', padding: '4px', textAlign: 'center',
                            background: '#222', border: '1px solid #F5C518', color: '#F5F5F5',
                            borderRadius: '3px', fontSize: '13px',
                          }}
                        />
                      </td>
                    );
                  }

                  return (
                    <td
                      style={{ cursor: 'pointer' }}
                      onClick={() => startEditing(product._id, idx, s.stock)}
                      title="Click to edit"
                    >
                      {s.stock === 0 
                        ? <span style={{ color: '#EF4444', fontWeight: 'bold' }}>0</span> 
                        : s.stock
                      }
                    </td>
                  );
                };

                return (
                  <tr key={product._id}>
                    <td>
                      <div className={styles.itemCell}>
                        <div className={styles.imgWrap}>
                          {product.images?.[0] && (
                            <Image src={product.images[0]} alt={product.name} fill style={{ objectFit: 'cover' }} />
                          )}
                        </div>
                        <span className={styles.itemName}>{product.name}</span>
                      </div>
                    </td>
                    <td><span className={styles.segmentBadge}>{product.segment}</span></td>
                    {renderSizeCell('S')}
                    {renderSizeCell('M')}
                    {renderSizeCell('L')}
                    {renderSizeCell('XL')}
                    {renderSizeCell('XXL')}
                    <td style={{ fontWeight: 'bold' }}>{product.totalStock}</td>
                    <td>
                      {product.totalStock === 0 ? (
                        <span className={styles.segmentBadge} style={{ backgroundColor: '#EF4444', color: '#fff' }}>OUT OF STOCK</span>
                      ) : product.totalStock < 10 ? (
                        <span className={styles.segmentBadge} style={{ borderColor: '#F5C518', color: '#F5C518' }}>LOW STOCK</span>
                      ) : (
                        <span className={styles.segmentBadge} style={{ borderColor: '#22C55E', color: '#22C55E' }}>HEALTHY</span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  No products found. Add products first to see inventory.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
