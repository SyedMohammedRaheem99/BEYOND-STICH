'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(isActive) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const container = ref.current;
    const previouslyFocused = document.activeElement;

    const focusables = () => [...container.querySelectorAll(FOCUSABLE)];
    const first = () => focusables()[0];
    const last = () => { const f = focusables(); return f[f.length - 1]; };

    // Focus the first element on open
    first()?.focus();

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (els.length === 0) { e.preventDefault(); return; }

      if (e.shiftKey) {
        if (document.activeElement === els[0]) {
          e.preventDefault();
          els[els.length - 1].focus();
        }
      } else {
        if (document.activeElement === els[els.length - 1]) {
          e.preventDefault();
          els[0].focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isActive]);

  return ref;
}
