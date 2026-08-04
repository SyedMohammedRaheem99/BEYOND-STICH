'use client';

import { motion } from 'framer-motion';

// Re-mounts on every navigation, so each route gets a clean enter transition.
// Opacity-only on purpose: a transform/filter here would create a containing
// block and break `position: sticky` (e.g. the PDP gallery). Respects
// prefers-reduced-motion via the app-level <MotionConfig reducedMotion="user">.
export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
