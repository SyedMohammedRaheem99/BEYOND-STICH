/**
 * Send one of each email template to yourself, filled with sample data.
 *
 *   node scripts/preview-emails.mjs you@gmail.com
 *
 * Use this after changing a template, to see what customers will actually
 * receive. Nothing is written to the database and no real order is touched.
 *
 * The logo only renders once NEXT_PUBLIC_SITE_URL points at a public host —
 * on localhost the <img> resolves to an address the mail client can't reach,
 * so expect a broken image there and a correct one after deploy.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

try {
  const raw = readFileSync(path.join(root, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  console.error('Could not read .env.local\n');
  process.exit(1);
}

const to = process.argv[2];
if (!to) {
  console.error('Usage: node scripts/preview-emails.mjs you@example.com\n');
  process.exit(1);
}

// Preview the live domain's assets even when running locally, so the logo
// resolves in the sample.
process.env.NEXT_PUBLIC_SITE_URL ||= 'https://beyondstich.com';
// Admin alert previews go to the same inbox as the rest.
process.env.ADMIN_ALERT_EMAIL = to;

// The `@/` alias is a bundler feature; a bare node script needs real paths.
const { pathToFileURL } = await import('node:url');
const srcDir = path.join(root, 'src', 'lib');
const { writeFileSync, mkdirSync, rmSync } = await import('node:fs');
const tmp = path.join(root, '.preview-tmp');
mkdirSync(tmp, { recursive: true });

for (const f of ['email.js', 'mailer.js']) {
  const code = readFileSync(path.join(srcDir, f), 'utf8')
    .replaceAll("'@/lib/mailer'", "'./mailer.js'")
    .replaceAll("'@/lib/mongodb'", "'./_db.js'")
    .replaceAll("'@/lib/models/EmailLog'", "'./_log.js'");
  writeFileSync(path.join(tmp, f), code);
}
// Previews shouldn't touch the database, so logging is stubbed out.
writeFileSync(path.join(tmp, '_db.js'), 'export default async () => {};\n');
writeFileSync(
  path.join(tmp, '_log.js'),
  'export default { create: async () => ({ _id: { toString: () => "preview" } }), updateOne: () => ({ catch: () => {} }) };\n'
);

const email = await import(pathToFileURL(path.join(tmp, 'email.js')).href);

const order = {
  orderNumber: 'BS-SAMPLE-01',
  email: to,
  createdAt: new Date(),
  items: [
    { name: 'MIND OVER MATTER', size: 'L', color: 'Black', quantity: 2, price: 949 },
    { name: 'SYNTH WAVE', size: 'XL', color: 'White', quantity: 1, price: 1099 },
  ],
  shippingAddress: {
    fullName: 'Rahul Sharma',
    street: '12 MG Road, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    phone: '9876543210',
  },
  subtotal: 2997,
  discount: 749,
  shipping: 0,
  total: 2248,
  couponCode: 'WELCOME25',
  paymentMethod: 'cod',
  trackingNumber: 'TRK99881234',
  refundAmount: 2248,
  refundReason: 'Size exchange requested',
};

const jobs = [
  ['Signup OTP', () => email.sendVerificationOtp(to, '482913', 'Rahul Sharma')],
  ['Order confirmation (COD)', () => email.sendOrderConfirmation(order)],
  ['Order confirmation (paid online)', () =>
    email.sendOrderConfirmation({ ...order, paymentMethod: 'online', orderNumber: 'BS-SAMPLE-02' })],
  ['Shipping update', () => email.sendShippingUpdate(order)],
  ['Password reset', () =>
    email.sendPasswordReset(to, `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/sample-token`)],
  ['Refund processed', () => email.sendRefundEmail(order)],
  ['Admin new-order alert', () => email.sendNewOrderAlert(order)],
];

console.log(`\nSending ${jobs.length} sample emails to ${to}\n`);

for (const [name, run] of jobs) {
  process.stdout.write(`  ${name.padEnd(34)}`);
  try {
    const r = await run();
    console.log(r?.ok ? 'sent' : `FAILED — ${r?.error || 'unknown'}`);
  } catch (err) {
    console.log(`FAILED — ${err.message}`);
  }
  // Hostinger throttles per hour; a short gap keeps a 7-message burst well
  // clear of the limit.
  await new Promise((r) => setTimeout(r, 1200));
}

rmSync(tmp, { recursive: true, force: true });

console.log(`\nCheck ${to} — open each on a phone as well as desktop.`);
console.log('Remote images are blocked by default in many clients: confirm');
console.log('the brand name still reads correctly with images turned off.\n');
process.exit(0);
