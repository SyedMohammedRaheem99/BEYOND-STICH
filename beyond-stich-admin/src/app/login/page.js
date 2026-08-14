'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <html lang="en">
      <body>
        <div style={styles.page}>
          <div style={styles.card}>
            <div style={styles.badge}>ADMIN ONLY</div>
            <h1 style={styles.title}>BEYOND STICH.</h1>
            <p style={styles.subtitle}>Command Center Access</p>

            <form onSubmit={handleLogin} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}

              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              <div style={styles.passwordWrap}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...styles.input, paddingRight: '44px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.btn,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD'}
              </button>
            </form>

            <p style={styles.footer}>
              Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0A0A0A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    padding: '20px',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    background: '#EF4444',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '4px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 900,
    letterSpacing: '0.1em',
    color: '#F5F5F5',
    margin: '0 0 8px',
  },
  subtitle: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  input: {
    padding: '14px 16px',
    background: '#1A1A1A',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#F5F5F5',
    fontSize: '14px',
    fontFamily: "'Space Grotesk', sans-serif",
    outline: 'none',
  },
  passwordWrap: {
    position: 'relative',
    display: 'flex',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    background: 'none',
    border: 'none',
    color: '#8A8A8A',
    cursor: 'pointer',
  },
  btn: {
    padding: '14px',
    background: '#F5F5F5',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 800,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    marginTop: '8px',
    fontFamily: "'Barlow Condensed', sans-serif",
  },
  error: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #EF4444',
    color: '#EF4444',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  footer: {
    color: '#444',
    fontSize: '11px',
    marginTop: '24px',
    letterSpacing: '0.05em',
  },
};
