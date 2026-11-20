import nodemailer from 'nodemailer';

/**
 * Outbound mail for the admin app.
 *
 * Mirrors the storefront's lib/mailer.js so both apps send through the same
 * mailbox with the same headers — a customer must not be able to tell that
 * the shipping email and the order confirmation came from different
 * codebases.
 *
 * This app previously imported the Resend SDK with no API key configured,
 * so every shipping and refund email it "sent" was silently dropped at the
 * `if (!resend) return` guard. Nothing errored and nothing arrived.
 *
 * Deliberately has no EmailLog dependency: the admin writes to the same
 * database but owns no part of that collection's lifecycle, and a logging
 * failure must never block a status update.
 */

const FROM = process.env.EMAIL_FROM || 'Beyond Stich <hello@beyondstich.com>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || FROM;

let cached = null;

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (cached) return cached;
  if (!smtpConfigured()) return null;

  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS. Getting this backwards
    // produces a hang rather than a clean failure.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return cached;
}

export function mailerConfigured() {
  return smtpConfigured();
}

/**
 * Plain-text alternative derived from the HTML body.
 *
 * An HTML-only message is a strong spam signal — real senders ship
 * multipart/alternative.
 */
export function htmlToText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/(p|div|tr|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&middot;/g, '·')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&minus;/g, '-')
    .replace(/&times;/g, 'x')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Send one message. Never throws — a failed notification must not roll back
 * an order status change that has already been written.
 */
export async function sendMail({ to, subject, html, text }) {
  const transport = getTransport();

  if (!transport) {
    console.warn(
      `[mail] SMTP not configured — "${subject}" to ${to} was NOT sent.\n` +
        '       Copy SMTP_HOST / SMTP_USER / SMTP_PASS from the storefront .env.local.'
    );
    return { ok: false, error: 'SMTP not configured' };
  }

  try {
    const info = await transport.sendMail({
      from: FROM,
      to,
      subject,
      html,
      text: text || htmlToText(html),
      replyTo: REPLY_TO,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
      },
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mail] FAILED "${subject}" to ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}
