'use client';

/**
 * Catches errors thrown by the root layout itself, which app/error.js cannot.
 * Without this the customer gets Next's unstyled default error screen.
 *
 * Must render its own <html>/<body> since it replaces the root layout.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '24px',
          background: '#0A0A0A',
          color: '#F5F5F5',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '24px', letterSpacing: '0.08em', margin: 0 }}>
          SOMETHING WENT WRONG
        </h1>
        <p style={{ color: '#9A9A9A', maxWidth: '420px', margin: 0, lineHeight: 1.6 }}>
          We hit an unexpected error. Your cart is safe — try again, or head back
          to the shop.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '14px 28px',
              minHeight: '48px',
              background: '#F5F5F5',
              color: '#0A0A0A',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            TRY AGAIN
          </button>
          <a
            href="/"
            style={{
              padding: '14px 28px',
              minHeight: '48px',
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid #2A2A2A',
              borderRadius: '4px',
              color: '#F5F5F5',
              textDecoration: 'none',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            GO HOME
          </a>
        </div>
      </body>
    </html>
  );
}
