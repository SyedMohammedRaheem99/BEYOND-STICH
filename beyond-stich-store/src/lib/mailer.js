import nodemailer from 'nodemailer';
import connectDB from '@/lib/mongodb';
import EmailLog from '@/lib/models/EmailLog';

/**
 * Outbound mail transport.
 *
 * Primary provider is the store's own mailbox over SMTP (Hostinger), which
 * is why this exists rather than calling a vendor SDK directly: the sending
 * account is ours, the volume allowance is ours, and nothing about a message
 * leaves our infrastructure except via the mail host we already pay for.
 *
 * `EMAIL_PROVIDER` selects the driver. It defaults to 'smtp'. The seam is
 * kept deliberately thin so a hosted API provider can be dropped in later by
 * setting one env var — shared-hosting IP reputation is outside our control,
 * and a migration path that needs no code change is cheap insurance.
 */

const PROVIDER = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();

const FROM = process.env.EMAIL_FROM || 'Beyond Stich <orders@beyondstich.com>';
// Replies to a transactional address usually want a human. Falls back to the
// From address so a missing env var can't produce an unanswerable email.
const REPLY_TO = process.env.EMAIL_REPLY_TO || FROM;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

let cachedTransport = null;

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

function getTransport() {
  if (cachedTransport) return cachedTransport;
  if (!smtpConfigured()) return null;

  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Port 465 is implicit TLS; 587 starts plaintext and upgrades via
    // STARTTLS. Getting this backwards is the usual cause of a connection
    // that hangs rather than failing cleanly.
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Shared hosts throttle per connection. Pooling reuses one authenticated
    // connection instead of handshaking per message, which is both faster and
    // far less likely to trip a rate limit during an order burst.
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    // Fail fast rather than holding a serverless invocation open: a hung SMTP
    // socket would otherwise keep the function alive until the platform kills
    // it, with no log line explaining why.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return cachedTransport;
}

/** True when mail can actually be sent. Call sites use this to degrade. */
export function mailerConfigured() {
  return PROVIDER === 'smtp' ? smtpConfigured() : false;
}

// ---------------------------------------------------------------------------
// Content helpers
// ---------------------------------------------------------------------------

/**
 * Derive a plain-text alternative from an HTML body.
 *
 * An HTML-only message is one of the strongest spam signals there is —
 * legitimate senders ship multipart/alternative. Generating this is also why
 * templates don't each need a hand-written text version.
 */
export function htmlToText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Keep the destination of a link visible — "click here" with no URL is
    // useless in a text part and reads as evasive to filters.
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
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Invisible 1x1 pixel. When it loads we know the message was rendered, which
 * means it reached an inbox rather than a spam folder.
 *
 * Only ever attached to transactional mail the recipient asked for, and it
 * records nothing but "this message was opened" against a log row we already
 * wrote when sending.
 */
function trackingPixel(logId) {
  if (!logId) return '';
  return `<img src="${SITE_URL}/api/email/open/${logId}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

/**
 * Send one message and record the attempt.
 *
 * Never throws: a failed confirmation email must not roll back a paid order.
 * Returns { ok, messageId, error } so a caller that *does* care — the OTP
 * flow, which is useless if the mail never left — can react.
 */
export async function sendMail({ to, subject, html, text, type = 'other', track = true }) {
  const transport = getTransport();

  if (!transport) {
    // Loud, and with the content, so local development can complete a signup
    // by reading the terminal instead of silently dead-ending.
    console.warn(
      `[mail] SMTP not configured — "${subject}" to ${to} was NOT sent.\n` +
        `       Set SMTP_HOST / SMTP_USER / SMTP_PASS in .env.local.\n` +
        (text || htmlToText(html)).slice(0, 500)
    );
    return { ok: false, error: 'SMTP not configured' };
  }

  // The log row is created first so its id can be baked into the tracking
  // pixel. A logging outage must not stop the mail going out, so this is
  // best-effort.
  let logId = null;
  try {
    await connectDB();
    const log = await EmailLog.create({ to, subject, type, status: 'failed', error: 'pending' });
    logId = log._id.toString();
  } catch (err) {
    console.error('[mail] could not open log row', err.message);
  }

  const finalHtml = track && logId ? `${html}${trackingPixel(logId)}` : html;
  const finalText = text || htmlToText(html);

  try {
    const info = await transport.sendMail({
      from: FROM,
      to,
      subject,
      html: finalHtml,
      // multipart/alternative — see htmlToText above.
      text: finalText,
      replyTo: REPLY_TO,
      headers: {
        // Tells filters this is a one-off reply to a user action, not bulk
        // mail, and asks well-behaved autoresponders to stay quiet.
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
      },
    });

    if (logId) {
      EmailLog.updateOne(
        { _id: logId },
        {
          $set: {
            status: 'sent',
            messageId: info.messageId || '',
            accepted: info.accepted || [],
            rejected: info.rejected || [],
            error: '',
          },
        }
      ).catch(() => {});
    }

    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mail] FAILED "${subject}" to ${to}:`, err.message);

    if (logId) {
      EmailLog.updateOne(
        { _id: logId },
        { $set: { status: 'failed', error: String(err.message).slice(0, 500) } }
      ).catch(() => {});
    }

    return { ok: false, error: err.message };
  }
}

/**
 * Open an SMTP connection and authenticate, without sending anything.
 * Used by scripts/test-email.js to separate "credentials are wrong" from
 * "the message was rejected".
 */
export async function verifyTransport() {
  const transport = getTransport();
  if (!transport) return { ok: false, error: 'SMTP not configured' };
  try {
    await transport.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
