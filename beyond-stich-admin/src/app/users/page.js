'use client';

import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

const ROLE_COLORS = {
  admin: { border: '#F5C518', color: '#F5C518' },
  customer: { border: '#3B82F6', color: '#3B82F6' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchUsers();

  const updateRole = async (userId, newRole) => {
    if (!confirm(`Change this user's role to ${newRole.toUpperCase()}?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...data.user } : u));
        if (selectedUser?._id === userId) setSelectedUser(prev => ({ ...prev, ...data.user }));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update');
      }
    } catch {
      alert('Network error');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        if (selectedUser?._id === userId) setSelectedUser(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Network error');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1>USERS</h1>
          <p>Manage registered customers and admin accounts.</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          <select className={styles.select} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ padding: '40px', color: '#666' }}>Loading users...</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>USER</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>PROVIDER</th>
                <th>ORDERS</th>
                <th>JOINED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map(user => {
                const rc = ROLE_COLORS[user.role] || ROLE_COLORS.customer;
                return (
                  <tr key={user._id}>
                    <td>
                      <div className={styles.itemCell}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#F8F8F8', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className={styles.itemMeta}>
                          <span className={styles.itemName}>{user.name}</span>
                          {user.phone && <span className={styles.itemStock}>{user.phone}</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{user.email}</td>
                    <td>
                      <span className={styles.segmentBadge} style={{ borderColor: rc.border, color: rc.color }}>
                        {user.role?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {user.provider === 'google' ? '🔵 Google' : '🔑 Email'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{user.orderCount}</span>
                      {user.totalSpent > 0 && (
                        <span style={{ color: '#666', fontSize: '11px', marginLeft: '4px' }}>
                          (₹{user.totalSpent.toLocaleString('en-IN')})
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => setSelectedUser(user)}>VIEW</button>
                        {user.role === 'customer' ? (
                          <button className={styles.editBtn} style={{ color: '#F5C518' }} onClick={() => updateRole(user._id, 'admin')}>
                            MAKE ADMIN
                          </button>
                        ) : (
                          <button className={styles.editBtn} style={{ color: '#94A3B8' }} onClick={() => updateRole(user._id, 'customer')}>
                            REMOVE ADMIN
                          </button>
                        )}
                        <button className={styles.deleteBtn} onClick={() => deleteUser(user._id)}>DELETE</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  No users found.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={modalStyles.overlay} onClick={() => setSelectedUser(null)}>
          <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, letterSpacing: '0.05em' }}>USER DETAILS</h2>
              <button onClick={() => setSelectedUser(null)} style={modalStyles.closeBtn}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#F8F8F8', fontFamily: 'var(--font-display)' }}>
                {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '16px', color: '#F5F5F5' }}>{selectedUser.name}</p>
                <p style={{ color: '#888', fontSize: '13px' }}>{selectedUser.email}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '4px', letterSpacing: '0.08em' }}>ROLE</h4>
                <span className={styles.segmentBadge} style={{ borderColor: ROLE_COLORS[selectedUser.role]?.border, color: ROLE_COLORS[selectedUser.role]?.color }}>
                  {selectedUser.role?.toUpperCase()}
                </span>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '4px', letterSpacing: '0.08em' }}>PROVIDER</h4>
                <p style={{ color: '#F5F5F5' }}>{selectedUser.provider === 'google' ? 'Google OAuth' : 'Email & Password'}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '4px', letterSpacing: '0.08em' }}>PHONE</h4>
                <p style={{ color: '#F5F5F5' }}>{selectedUser.phone || '—'}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '4px', letterSpacing: '0.08em' }}>JOINED</h4>
                <p style={{ color: '#F5F5F5' }}>{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '4px', letterSpacing: '0.08em' }}>TOTAL ORDERS</h4>
                <p style={{ color: '#F5F5F5', fontWeight: 700 }}>{selectedUser.orderCount}</p>
              </div>
              <div>
                <h4 style={{ color: '#888', fontSize: '11px', marginBottom: '4px', letterSpacing: '0.08em' }}>TOTAL SPENT</h4>
                <p style={{ color: '#F5F5F5', fontWeight: 700 }}>₹{(selectedUser.totalSpent || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
              {selectedUser.role === 'customer' ? (
                <button onClick={() => updateRole(selectedUser._id, 'admin')} style={{ ...actionBtnStyle, background: '#F5C518', color: '#0A0A0A' }}>
                  MAKE ADMIN
                </button>
              ) : (
                <button onClick={() => updateRole(selectedUser._id, 'customer')} style={{ ...actionBtnStyle, background: '#94A3B8', color: '#0A0A0A' }}>
                  REMOVE ADMIN
                </button>
              )}
              <button onClick={() => deleteUser(selectedUser._id)} style={{ ...actionBtnStyle, background: 'transparent', color: '#EF4444', border: '1px solid #333' }}>
                DELETE USER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '12px',
  letterSpacing: '0.08em',
  cursor: 'pointer',
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px', overflowY: 'auto' },
  modal: { background: '#111', border: '1px solid #333', borderRadius: '8px', width: '100%', maxWidth: '550px', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
};
