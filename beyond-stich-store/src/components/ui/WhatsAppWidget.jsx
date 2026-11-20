'use client';

import { BRAND } from '@/lib/constants';
import styles from './WhatsAppWidget.module.css';

// A single tap straight into WhatsApp. This used to open a popover that
// imitated a support inbox — an avatar reading "BS", a "Hey there! 👋" chat
// bubble, and a "💬 Start Chat on WhatsApp" button — which read as a toy
// widget rather than a real channel, and cost two taps to do one thing.
// The floating button carries the official WhatsApp glyph, so the brand is
// already legible without any of that dressing.
export default function WhatsAppWidget() {
  const message = encodeURIComponent(
    'Hi Beyond Stich team, I have a question about my order / products.'
  );

  return (
    <div className={styles.whatsappWrapper}>
      <a
        href={`https://wa.me/${BRAND.phoneE164}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.triggerBtn}
        aria-label="Message Beyond Stich on WhatsApp"
      >
        <svg aria-hidden="true" viewBox="0 0 32 32" className={styles.waIcon}>
          <path
            fill="currentColor"
            d="M16 2a13.9 13.9 0 0 0-12 21L2 30l7.2-1.9A13.9 13.9 0 1 0 16 2zm7.9 19.6c-.3.9-1.8 1.7-2.5 1.8-.7.1-1.6.2-5.1-1.2-4.3-1.8-7-6.1-7.2-6.4-.2-.3-1.8-2.4-1.8-4.6 0-2.2 1.2-3.3 1.6-3.7.4-.4.9-.5 1.2-.5h.9c.3 0 .7.1.9.7.3.8 1.1 2.7 1.2 2.9.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.6.6-.2.2-.4.4-.2.8.5.9 1.8 2.5 3.3 3.8 1.9 1.7 3.5 2.2 4 2.4.5.2.8.2 1.1-.2.3-.4 1.3-1.5 1.7-2 .4-.5.8-.4 1.3-.2.5.2 3.2 1.5 3.7 1.8.5.3.9.4 1 .6.1.4 0 1.9-.3 2.8z"
          />
        </svg>
      </a>
    </div>
  );
}
