'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './CustomCursor.module.css';

/**
 * Expanding ring that follows the pointer and grows over interactive targets.
 *
 * This was removed in the UI overhaul and is deliberately reinstated. The
 * original failed for reasons worth not repeating:
 *
 *  - it hid the native cursor globally via `cursor: none`, which leaked past
 *    the reduced-motion guard and left some users with no pointer at all;
 *  - it ran for touch traffic, where it is meaningless.
 *
 * So this version never writes `cursor: none` from JS. The hiding lives in
 * one CSS rule gated behind BOTH `pointer: fine` and
 * `prefers-reduced-motion: no-preference`, and the component itself refuses
 * to mount unless those same conditions hold. If anything goes wrong the
 * page simply keeps the normal arrow.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const ringRef = useRef(null);
  const raf = useRef(0);
  // Target position (true pointer) and rendered position (eased toward it).
  const target = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });

  // Only run where a real pointing device is present and motion is welcome.
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      // Grow over anything clickable. Checked per-move via closest() rather
      // than by attaching listeners to every card, so product tiles rendered
      // later (filtering, pagination) are covered without re-binding.
      const el = e.target instanceof Element ? e.target : null;
      setHovering(
        !!el?.closest('a, button, [role="button"], input, select, textarea, label')
      );
    };

    // Trail slightly behind the pointer. Reading transform straight from a
    // ref in a rAF loop keeps this off React's render path entirely.
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    // Leaving the window should park the ring rather than freeze it mid-page.
    const onLeave = () => {
      target.current.x = -100;
      target.current.y = -100;
    };
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className={`${styles.ring} ${hovering ? styles.ringHover : ''}`}
    />
  );
}
