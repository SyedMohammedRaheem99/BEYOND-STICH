'use client';

import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';

export const THEME_KEY = 'bs-theme';

/**
 * Light/dark switch. Dark is the default and stays the default — this only
 * does something once a visitor chooses otherwise, and the choice is
 * remembered per browser.
 *
 * The device's own colour-scheme preference is deliberately ignored. Most
 * phones ship set to light, so following it would hand the majority of first
 * impressions to a theme the brand was not designed around.
 *
 * The class is applied by an inline script in the document head (see
 * layout.js) so it lands before first paint. Doing it here, in an effect,
 * would paint dark first and then flip — the flash this component exists to
 * avoid.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read what the head script already applied rather than re-deciding, so
    // the button can never disagree with the page it sits on.
    const current =
      document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing state from a browser/session/URL source that is unavailable during render
    setTheme(current);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing state from a browser/session/URL source that is unavailable during render
    setReady(true);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);

    // Dark is the default, so it is stored as the absence of an attribute —
    // one less state to keep in sync.
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private browsing can refuse. The theme still applies for this visit.
    }
  };

  const goingTo = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.toggle}
      aria-label={`Switch to ${goingTo} mode`}
      title={`Switch to ${goingTo} mode`}
      // Rendered server-side as dark; hidden until mounted so a visitor in
      // light mode never sees the wrong icon for a frame.
      style={{ visibility: ready ? 'visible' : 'hidden' }}
    >
      {theme === 'light' ? (
        // Moon — what you would switch TO.
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
