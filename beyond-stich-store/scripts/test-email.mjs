/**
 * Send a test email through the configured SMTP transport.
 *
 *   node scripts/test-email.js you@gmail.com
 *
 * Checks two things separately, because they fail for different reasons:
 *
 *   1. Can we authenticate against the mail host at all?  (wrong password,
 *      wrong port, firewall — fails before any message is built)
 *   2. Will the host accept a message for this recipient?  (rate limit,
 *      rejected sender, bad address)
 *
 * A pass here still does not prove inbox placement. Send one to Gmail, one
 * to Outlook and one to Yahoo, then open each and check whether it landed in
 * the inbox or in spam — that is the only honest test on shared hosting.
 */

// next.config and the app read .env.local automatically; a bare node script
// does not, so load it by hand before anything imports process.env.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

try {
  const raw = readFileSync(path.join(root, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Tolerate quoted values — a password with a '#' or spaces needs them.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  console.error('Could not read .env.local — create it first.\n');
  process.exit(1);
}

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const to = process.argv[2];
if (!to) {
  console.error('Usage: node scripts/test-email.js you@example.com\n');
  process.exit(1);
}

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, EMAIL_FROM } =
  process.env;

const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(', ')}\n`);
  process.exit(1);
}

const port = parseInt(SMTP_PORT || '465', 10);
const secure = SMTP_SECURE ? SMTP_SECURE === 'true' : port === 465;

console.log('\n─── SMTP configuration ───');
console.log(`  host    ${SMTP_HOST}`);
console.log(`  port    ${port} (${secure ? 'implicit TLS' : 'STARTTLS'})`);
console.log(`  user    ${SMTP_USER}`);
console.log(`  pass    ${'*'.repeat(Math.min((SMTP_PASS || '').length, 12))}`);
console.log(`  from    ${EMAIL_FROM || '(not set — will use SMTP_USER)'}`);
console.log(`  to      ${to}\n`);

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
});

console.log('[1/2] Authenticating…');
try {
  await transport.verify();
  console.log('      connected and authenticated\n');
} catch (err) {
  console.error('      FAILED:', err.message, '\n');
  if (/auth/i.test(err.message)) {
    console.error('      Wrong mailbox password, or the host requires the full');
    console.error('      address as the username.\n');
  } else if (/timeout|ECONNREFUSED|ETIMEDOUT/i.test(err.message)) {
    console.error('      Nothing answered on that host/port. Try port 587 with');
    console.error('      SMTP_SECURE=false, or check an outbound firewall.\n');
  }
  process.exit(1);
}

console.log('[2/2] Sending test message…');
const stamp = new Date().toLocaleString('en-IN');
try {
  const info = await transport.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject: `Beyond Stich — SMTP test (${stamp})`,
    text: [
      'This is a test message from the Beyond Stich store.',
      '',
      `Sent: ${stamp}`,
      `Host: ${SMTP_HOST}:${port}`,
      '',
      'If this is in your inbox, SMTP is working.',
      'If it is in spam, the DNS records (SPF / DKIM / DMARC) still need work.',
    ].join('\n'),
    html: `
      <div style="max-width:560px;margin:0 auto;background:#0A0A0A;color:#F8F8F8;font-family:Arial,sans-serif;padding:32px;">
        <h1 style="margin:0 0 4px;font-size:24px;letter-spacing:0.05em;">BEYOND STICH</h1>
        <p style="color:#8A8A8A;font-size:11px;letter-spacing:0.1em;margin:0 0 24px;">SMTP TEST</p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">
          If you are reading this, the mail transport is working.
        </p>
        <table style="font-size:13px;color:#A0A0A0;">
          <tr><td style="padding:2px 12px 2px 0;">Sent</td><td>${stamp}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;">Host</td><td>${SMTP_HOST}:${port}</td></tr>
        </table>
        <p style="font-size:12px;color:#8A8A8A;margin:24px 0 0;line-height:1.6;">
          Inbox → SMTP is healthy.<br/>
          Spam → DNS records (SPF / DKIM / DMARC) still need work.
        </p>
      </div>
    `,
  });

  console.log('      accepted by the server');
  console.log(`      message id: ${info.messageId}`);
  if (info.accepted?.length) console.log(`      accepted:   ${info.accepted.join(', ')}`);
  if (info.rejected?.length) console.log(`      rejected:   ${info.rejected.join(', ')}`);

  console.log('\n─── Now check by hand ───');
  console.log(`  Open ${to} and confirm:`);
  console.log('    · did it arrive at all?');
  console.log('    · inbox, or spam?');
  console.log('  Repeat for a Gmail, an Outlook and a Yahoo address —');
  console.log('  each filters differently.\n');
} catch (err) {
  console.error('      FAILED:', err.message, '\n');
  process.exit(1);
}

transport.close();
