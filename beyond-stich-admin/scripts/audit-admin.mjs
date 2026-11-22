/**
 * Admin panel audit: every screen, at three widths, behind a real login.
 *
 *   node scripts/audit-admin.mjs
 *   node scripts/audit-admin.mjs https://admin.beyondstich.com
 *
 * Needs credentials for an admin account:
 *
 *   AUDIT_ADMIN_EMAIL=… AUDIT_ADMIN_PASSWORD=… node scripts/audit-admin.mjs
 *
 * Same structural checks as the storefront audit — overflow, console
 * errors, failed requests, touch targets, headings — plus the two things
 * specific to an operator tool: that every screen actually renders its
 * data, and that no screen is unusable on a phone (orders get checked from
 * a phone far more often than anyone plans for).
 *
 * Read-only: it logs in, looks, and logs out. No record is created or
 * modified.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:3001').replace(/\/$/, '');
const EMAIL = process.env.AUDIT_ADMIN_EMAIL || 'zz-audit-temp@beyondstich.local';
const PASSWORD = process.env.AUDIT_ADMIN_PASSWORD || 'AuditTemp#2026!';

const WIDTHS = [
  [390, 844, 'mobile'],
  [768, 1024, 'tablet'],
  [1440, 900, 'desktop'],
];

const PAGES = [
  ['/', 'Overview'],
  ['/products', 'Products'],
  ['/product-types', 'Product types'],
  ['/orders', 'Orders'],
  ['/inventory', 'Inventory'],
  ['/delivery', 'Delivery'],
  ['/coupons', 'Coupons'],
  ['/reviews', 'Reviews'],
  ['/analytics', 'Analytics'],
  ['/users', 'Users'],
];

const findings = [];
const add = (severity, page, width, type, detail) =>
  findings.push({ severity, page, width, type, detail });

const browser = await chromium.launch();
console.log(`\nAuditing admin at ${BASE}\n`);

// --- log in once, reuse the session cookie -------------------------------
const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const loginPage = await authCtx.newPage();
await loginPage.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });

const loginRes = await loginPage.evaluate(
  async ({ base, email, password }) => {
    const r = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return { status: r.status, body: (await r.text()).slice(0, 160) };
  },
  { base: BASE, email: EMAIL, password: PASSWORD }
);

if (loginRes.status !== 200) {
  console.error(`Login failed (HTTP ${loginRes.status}): ${loginRes.body}\n`);
  console.error('Set AUDIT_ADMIN_EMAIL and AUDIT_ADMIN_PASSWORD, or create a temp admin.\n');
  await browser.close();
  process.exit(1);
}
console.log('  logged in\n');

const storage = await authCtx.storageState();
await authCtx.close();

// --- sweep ----------------------------------------------------------------
for (const [path, label] of PAGES) {
  for (const [w, h, widthLabel] of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, storageState: storage });
    const page = await ctx.newPage();

    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 150));
    });
    page.on('response', (r) => {
      if (r.status() >= 400) failedRequests.push(`HTTP ${r.status()} ${r.url().replace(BASE, '').slice(0, 90)}`);
    });

    try {
      const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if ((res?.status() ?? 0) >= 400) {
        add('HIGH', label, widthLabel, 'bad-status', `HTTP ${res.status()}`);
      }
      // Admin screens fetch their data client-side after mount.
      await page.waitForTimeout(3000);
    } catch (e) {
      add('HIGH', label, widthLabel, 'load-failed', e.message.slice(0, 110));
      await ctx.close();
      continue;
    }

    // Redirected back to login means the session was not accepted.
    if (page.url().includes('/login')) {
      add('HIGH', label, widthLabel, 'auth-redirect', 'bounced to /login with a valid session');
      await ctx.close();
      continue;
    }

    const audit = await page.evaluate(() => {
      const out = {};
      const doc = document.documentElement;
      out.scrollWidth = doc.scrollWidth;
      out.clientWidth = doc.clientWidth;

      out.overflowing = [];
      if (doc.scrollWidth > doc.clientWidth + 1) {
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (getComputedStyle(el).position === 'fixed') continue;
          if (r.right > doc.clientWidth + 1) {
            out.overflowing.push({
              sel: el.tagName.toLowerCase() +
                   (el.className ? '.' + String(el.className).split(' ')[0].slice(0, 32) : ''),
              over: Math.round(r.right - doc.clientWidth),
            });
            if (out.overflowing.length >= 3) break;
          }
        }
      }

      // Did the screen actually render data, or is it stuck/empty? An
      // operator tool that silently shows nothing is worse than one that
      // errors.
      const text = document.body.innerText || '';
      out.stuckLoading = /loading/i.test(text) && text.trim().length < 400;
      out.rowCount = document.querySelectorAll('tbody tr').length;
      out.hasTable = Boolean(document.querySelector('table'));
      out.emptyMessage = /no .{0,24}(found|yet)|nothing here/i.test(text);

      // Touch targets, honouring ::after hit-area expanders.
      out.smallTargets = [];
      for (const el of document.querySelectorAll('button, a[href], input[type="submit"], select')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        let hitH = r.height;
        for (const p of ['::after', '::before']) {
          const ps = getComputedStyle(el, p);
          if (ps.content === 'none') continue;
          const top = parseFloat(ps.top), bottom = parseFloat(ps.bottom);
          if (top < 0 || bottom < 0) {
            hitH = Math.max(hitH, r.height + Math.abs(Math.min(top || 0, 0)) + Math.abs(Math.min(bottom || 0, 0)));
          }
        }
        if (el.tagName === 'A' && cs.display === 'inline') continue;
        if (hitH < 44) {
          const t = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24);
          out.smallTargets.push(`${Math.round(r.width)}x${Math.round(hitH)} "${t}"`);
        }
      }
      out.smallTargets = [...new Set(out.smallTargets)].slice(0, 4);

      // Headings.
      out.h1Count = document.querySelectorAll('h1').length;

      // Controls with no accessible name.
      out.unnamed = [];
      for (const el of document.querySelectorAll('button, input, select')) {
        if (el.getBoundingClientRect().width === 0) continue;
        const name = (el.textContent || '').trim() || el.getAttribute('aria-label') ||
          el.getAttribute('title') || (el.labels?.length ? 'ok' : '') ||
          el.getAttribute('placeholder');
        if (!name) out.unnamed.push(el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : ''));
      }
      out.unnamed = [...new Set(out.unnamed)].slice(0, 4);

      return out;
    });

    if (audit.overflowing.length) {
      add('HIGH', label, widthLabel, 'horizontal-overflow',
        `${audit.scrollWidth}px vs ${audit.clientWidth}px — ` +
        audit.overflowing.map((o) => `${o.sel} +${o.over}px`).join(', '));
    }
    if (audit.stuckLoading) {
      add('HIGH', label, widthLabel, 'stuck-loading', 'screen still shows a loading state after 3s');
    }
    if (audit.hasTable && audit.rowCount === 0 && !audit.emptyMessage) {
      add('MEDIUM', label, widthLabel, 'empty-no-message', 'table rendered 0 rows with no empty-state message');
    }
    for (const e of [...new Set(consoleErrors)].slice(0, 3)) add('MEDIUM', label, widthLabel, 'console-error', e);
    for (const f of [...new Set(failedRequests)].slice(0, 3)) add('HIGH', label, widthLabel, 'request-failed', f);
    if (widthLabel === 'mobile') {
      for (const t of audit.smallTargets) add('MEDIUM', label, widthLabel, 'touch-target-small', t);
    }
    if (widthLabel === 'desktop') {
      if (audit.h1Count === 0) add('MEDIUM', label, widthLabel, 'no-h1', 'screen has no <h1>');
      for (const u of audit.unnamed) add('MEDIUM', label, widthLabel, 'control-unnamed', u);
      console.log(`  ${label.padEnd(16)} ${audit.rowCount} row(s)`);
    }

    await ctx.close();
  }
}

await browser.close();

const by = (s) => findings.filter((f) => f.severity === s);
console.log(`\n${findings.length} findings — HIGH ${by('HIGH').length} · MEDIUM ${by('MEDIUM').length}\n`);

for (const sev of ['HIGH', 'MEDIUM', 'LOW']) {
  const list = by(sev);
  if (!list.length) continue;
  console.log(sev);
  const grouped = {};
  for (const f of list) (grouped[f.type] ||= []).push(f);
  for (const [type, items] of Object.entries(grouped)) {
    console.log(`  ${type} (${items.length})`);
    for (const i of items.slice(0, 8)) console.log(`    ${i.page} @${i.width}: ${i.detail}`);
    if (items.length > 8) console.log(`    …and ${items.length - 8} more`);
  }
  console.log('');
}

writeFileSync('.audit-admin.json', JSON.stringify({ base: BASE, at: new Date().toISOString(), findings }, null, 2));
console.log('Full report: .audit-admin.json\n');
