'use client';

import { useEffect, useRef } from 'react';

/**
 * Confirmation gate for actions that can't be undone.
 *
 * Cancelling an order, marking a return, and processing a refund all have
 * consequences outside this database — stock moves, and the customer gets an
 * email saying their money is on the way. Any of those was previously one
 * click with no confirmation.
 *
 * `effects` lists what will actually happen, in plain language, so the
 * dialog states the consequences rather than asking a vague "are you sure?".
 * A native window.confirm() can't do that, and is suppressible per-site.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  effects = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);
  const panelRef = useRef(null);

  // Escape closes; focus moves into the dialog so a keyboard user isn't left
  // tabbing around the page behind it.
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.();
      if (e.key === 'Tab') {
        const els = panelRef.current?.querySelectorAll('button:not([disabled])');
        if (!els?.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus Cancel, not Confirm: the safe option should be the one a stray
    // Enter keypress lands on.
    const t = setTimeout(() => confirmRef.current?.focus(), 50);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const accent = danger ? '#EF4444' : '#F5C518';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.78)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={() => !busy && onCancel?.()}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#151515',
          border: `1px solid ${danger ? 'rgba(239,68,68,0.4)' : '#2A2A2A'}`,
          borderRadius: '12px',
          maxWidth: '460px',
          width: '100%',
          padding: '26px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <h3
          id="confirm-title"
          style={{
            margin: '0 0 10px',
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '21px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          {title}
        </h3>

        {message && (
          <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: 1.6, color: '#A0A0A0' }}>
            {message}
          </p>
        )}

        {effects.length > 0 && (
          <ul
            style={{
              margin: '0 0 22px',
              padding: '14px 16px',
              listStyle: 'none',
              background: '#0A0A0A',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
            }}
          >
            {effects.map((e, i) => (
              <li
                key={i}
                style={{
                  fontSize: '13px',
                  lineHeight: 1.65,
                  color: '#F8F8F8',
                  paddingLeft: '16px',
                  position: 'relative',
                  marginTop: i ? '8px' : 0,
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: accent }}>›</span>
                {e}
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            ref={confirmRef}
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '11px 20px',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#F8F8F8',
              background: 'transparent',
              border: '1px solid #2A2A2A',
              borderRadius: '6px',
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: '11px 22px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: danger ? '#FFFFFF' : '#0A0A0A',
              background: busy ? '#555' : accent,
              border: 'none',
              borderRadius: '6px',
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
