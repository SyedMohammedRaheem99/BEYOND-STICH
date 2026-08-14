'use client';

import { useState } from 'react';
import styles from './WhatsAppWidget.module.css';

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = '919876543210'; // Replace with brand WhatsApp number
  const defaultMsg = encodeURIComponent('Hi Beyond Stich team, I have a question about my order / products.');

  return (
    <div className={styles.whatsappWrapper}>
      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.popoverHeader}>
            <div className={styles.avatar}>BS</div>
            <div>
              <strong>Beyond Stich Support</strong>
              <p>Replies within a few minutes</p>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className={styles.popoverBody}>
            <p className={styles.chatBubble}>
              Hey there! 👋 How can we help you style your fit today?
            </p>
            <a
              href={`https://wa.me/${phoneNumber}?text=${defaultMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.startChatBtn}
            >
              💬 Start Chat on WhatsApp
            </a>
          </div>
        </div>
      )}

      <button
        className={styles.triggerBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Contact support on WhatsApp"
      >
        <svg viewBox="0 0 32 32" className={styles.waIcon}>
          <path
            fill="currentColor"
            d="M16 2a13.9 13.9 0 0 0-12 21L2 30l7.2-1.9A13.9 13.9 0 1 0 16 2zm7.9 19.6c-.3.9-1.8 1.7-2.5 1.8-.7.1-1.6.2-5.1-1.2-4.3-1.8-7-6.1-7.2-6.4-.2-.3-1.8-2.4-1.8-4.6 0-2.2 1.2-3.3 1.6-3.7.4-.4.9-.5 1.2-.5h.9c.3 0 .7.1.9.7.3.8 1.1 2.7 1.2 2.9.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.6.6-.2.2-.4.4-.2.8.5.9 1.8 2.5 3.3 3.8 1.9 1.7 3.5 2.2 4 2.4.5.2.8.2 1.1-.2.3-.4 1.3-1.5 1.7-2 .4-.5.8-.4 1.3-.2.5.2 3.2 1.5 3.7 1.8.5.3.9.4 1 .6.1.4 0 1.9-.3 2.8z"
          />
        </svg>
      </button>
    </div>
  );
}
