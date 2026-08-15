'use client';

import Link from 'next/link';

/**
 * Checkout-specific boundary. Without one, a throw anywhere in checkout
 * unmounted all the way to the root error page, which gives the customer no
 * route back to their bag — and the cart is still intact, so bouncing them to
 * a generic "system failure" screen loses a sale unnecessarily.
 */
export default function CheckoutError({ error, reset }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '0 var(--container-padding)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', letterSpacing: '0.08em' }}>
        CHECKOUT HIT A SNAG
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px', lineHeight: 1.6 }}>
        Your bag is still saved. No order was placed and nothing was charged.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '14px 28px',
            minHeight: '48px',
            background: 'var(--color-text-primary)',
            color: 'var(--color-bg)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          TRY AGAIN
        </button>
        <Link
          href="/shop"
          style={{
            padding: '14px 28px',
            minHeight: '48px',
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          BACK TO SHOP
        </Link>
      </div>
    </div>
  );
}
