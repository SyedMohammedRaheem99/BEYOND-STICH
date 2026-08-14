'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// The real cursor (CustomCursorInner) pulls in framer-motion's
// useMotionValue/useSpring and renders null on touch devices — but that
// check ran *after* the component, and its JS, had already loaded. Nearly
// all traffic here is mobile, so every visitor was downloading and parsing
// spring-physics code purely to immediately discard it.
//
// This gate decides BEFORE importing anything: only devices with a fine
// pointer (mouse/trackpad) ever fetch CustomCursorInner's chunk at all.
const CustomCursorInner = dynamic(() => import('./CustomCursorInner'), { ssr: false });

export default function CustomCursor() {
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setShowCursor(fine && !reduceMotion);
  }, []);

  if (!showCursor) return null;
  return <CustomCursorInner />;
}
