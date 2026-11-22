/**
 * Full-site audit: every page, at three widths.
 *
 *   node scripts/audit.mjs                       # localhost
 *   node scripts/audit.mjs https://beyondstich.com
 *
 * Checks the faults that are invisible until a customer hits them:
 *
 *   - horizontal overflow (the "broken on mobile" symptom)
 *   - console errors and failed network requests
 *   - images with no alt text, or that 404
 *   - touch targets below 44px
 *   - headings that skip a level, and pages with no h1
 *   - text too small to read on a phone
 *
 * Read-only. Writes a JSON report to .audit-report.json.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

const WIDTHS = [
  [360, 780, 'mobile'],
  [768, 1024, 'tablet'],
  [1440, 900, 'desktop'],
];

// Representative of every template, not every URL — segment and product
// pages share one layout each.
const PAGES = [
  ['/', 'Home'],
  ['/shop', 'Shop'],
  ['/product/unzip-white-oversized-tee', 'Product'],
  ['/segment/gym', 'Segment'],
  ['/checkout', 'Checkout (empty)'],
  ['/track', 'Track order'],
  ['/login', 'Login'],
  ['/register', 'Register'],
  ['/forgot-password', 'Forgot password'],
  ['/verify-email?email=test@example.com', 'Verify email'],
  ['/account/wishlist', 'Wishlist'],
  ['/size-guide', 'Size guide'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
  ['/faq', 'FAQ'],
  ['/shipping', 'Shipping'],
  ['/returns', 'Returns'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
  ['/blog', 'Blog'],
  ['/stores/bangalore', 'Store page'],
  ['/this-page-does-not-exist', '404'],
];

const findings = [];
const add = (severity, page, width, type, detail) =>
  findings.push({ severity, page, width, type, detail });

const browser = await chromium.launch();
console.log(`\nAuditing ${BASE}\n`);

for (const [path, label] of PAGES) {
  for (const [w, h, widthLabel] of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();

    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160));
    });
    page.on('requestfailed', (r) => {
      const u = r.url();
      // A dev-server HMR socket dropping is noise, not a defect.
      if (!/_next\/static\/chunks\/.*hmr|__nextjs/.test(u)) {
        failedRequests.push(`${r.failure()?.errorText || 'failed'} ${u.slice(0, 110)}`);
      }
    });
    page.on('response', (r) => {
      if (r.status() >= 400 && !/this-page-does-not-exist/.test(r.url())) {
        failedRequests.push(`HTTP ${r.status()} ${r.url().slice(0, 110)}`);
      }
    });

    let status = 0;
    try {
      const res = await page.goto(`${BASE}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      status = res?.status() ?? 0;
      // Let client components hydrate and lazy images settle.
      await page.waitForTimeout(1800);
    } catch (e) {
      add('HIGH', label, widthLabel, 'load-failed', e.message.slice(0, 120));
      await ctx.close();
      continue;
    }

    const expected404 = path.includes('does-not-exist');
    if (!expected404 && status >= 400) {
      add('HIGH', label, widthLabel, 'bad-status', `HTTP ${status}`);
    }

    const audit = await page.evaluate(() => {
      const out = {};
      const doc = document.documentElement;

      out.scrollWidth = doc.scrollWidth;
      out.clientWidth = doc.clientWidth;

      // What specifically is wider than the viewport.
      out.overflowing = [];
      if (doc.scrollWidth > doc.clientWidth + 1) {
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (getComputedStyle(el).position === 'fixed') continue;
          if (r.right > doc.clientWidth + 1) {
            out.overflowing.push({
              sel: el.tagName.toLowerCase() +
                   (el.className ? '.' + String(el.className).split(' ')[0].slice(0, 36) : ''),
              over: Math.round(r.right - doc.clientWidth),
            });
            if (out.overflowing.length >= 4) break;
          }
        }
      }

      // Images: missing alt, or broken.
      out.imgNoAlt = [];
      out.imgBroken = [];
      for (const img of document.querySelectorAll('img')) {
        const alt = img.getAttribute('alt');
        if (alt === null) out.imgNoAlt.push((img.currentSrc || img.src || '').slice(-60));
        if (img.complete && img.naturalWidth === 0 && img.src) {
          out.imgBroken.push(img.src.slice(-70));
        }
      }

      // Touch targets. Checked at every width, but only reported on mobile.
      out.smallTargets = [];
      for (const el of document.querySelectorAll('button, a[href], input[type="submit"]')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        // A ::after/::before with negative insets is a deliberate
        // hit-area expander (carousel dots use one); measure the real
        // tappable box, not the painted one.
        let hitH = r.height, hitW = r.width;
        for (const pseudo of ['::after', '::before']) {
          const ps = getComputedStyle(el, pseudo);
          if (ps.content === 'none') continue;
          const top = parseFloat(ps.top), bottom = parseFloat(ps.bottom);
          const left = parseFloat(ps.left), right = parseFloat(ps.right);
          if (top < 0 || bottom < 0) hitH = Math.max(hitH, r.height + Math.abs(Math.min(top || 0, 0)) + Math.abs(Math.min(bottom || 0, 0)));
          if (left < 0 || right < 0) hitW = Math.max(hitW, r.width + Math.abs(Math.min(left || 0, 0)) + Math.abs(Math.min(right || 0, 0)));
        }
        // Inline links inside a paragraph are not tap targets in the same
        // sense as buttons — flagging every one drowns the real findings.
        const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
        if (!inline && (hitH < 44 || hitW < 24)) {
          const t = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 26);
          out.smallTargets.push(`${Math.round(hitW)}x${Math.round(hitH)} "${t}"`);
        }
      }
      out.smallTargets = out.smallTargets.slice(0, 5);

      // Headings.
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
      out.h1Count = hs.filter((e) => e.tagName === 'H1').length;
      out.headingSkips = [];
      let prev = 0;
      for (const hEl of hs) {
        const lvl = Number(hEl.tagName[1]);
        if (prev && lvl > prev + 1) {
          out.headingSkips.push(`h${prev} -> h${lvl} "${(hEl.textContent || '').trim().slice(0, 30)}"`);
        }
        prev = lvl;
      }

      // Controls with no accessible name.
      out.unnamed = [];
      for (const el of document.querySelectorAll('button, a[href], input, select')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const name = (el.textContent || '').trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          (el.labels && el.labels.length ? 'labelled' : '') ||
          el.getAttribute('placeholder') ||
          // An image's alt text names its wrapping link.
          [...el.querySelectorAll('img[alt]')].map((i) => i.getAttribute('alt')).join('') ||
          [...el.querySelectorAll('svg title')].map((t) => t.textContent).join('');
        if (!name) out.unnamed.push(el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0].slice(0, 30) : ''));
      }
      out.unnamed = [...new Set(out.unnamed)].slice(0, 5);

      // Body text under 12px is hard to read on a phone.
      out.tinyText = [];
      for (const el of document.querySelectorAll('p, li, span, td, dd')) {
        if (!el.textContent?.trim()) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 11) {
          out.tinyText.push(`${fs}px "${el.textContent.trim().slice(0, 24)}"`);
        }
      }
      out.tinyText = [...new Set(out.tinyText)].slice(0, 3);

      return out;
    });

    // --- record findings -------------------------------------------------
    if (audit.overflowing.length) {
      add('HIGH', label, widthLabel, 'horizontal-overflow',
        `page ${audit.scrollWidth}px vs ${audit.clientWidth}px — ` +
        audit.overflowing.map((o) => `${o.sel} +${o.over}px`).join(', '));
    }
    for (const e of consoleErrors.slice(0, 3)) add('MEDIUM', label, widthLabel, 'console-error', e);
    for (const f of [...new Set(failedRequests)].slice(0, 3)) add('HIGH', label, widthLabel, 'request-failed', f);
    for (const i of audit.imgBroken.slice(0, 3)) add('HIGH', label, widthLabel, 'broken-image', i);
    if (widthLabel === 'desktop') {
      for (const i of audit.imgNoAlt.slice(0, 3)) add('MEDIUM', label, widthLabel, 'img-missing-alt', i);
      if (audit.h1Count === 0) add('MEDIUM', label, widthLabel, 'no-h1', 'page has no <h1>');
      if (audit.h1Count > 1) add('LOW', label, widthLabel, 'multiple-h1', `${audit.h1Count} <h1> elements`);
      for (const s of audit.headingSkips.slice(0, 2)) add('LOW', label, widthLabel, 'heading-skip', s);
      for (const u of audit.unnamed) add('MEDIUM', label, widthLabel, 'control-unnamed', u);
    }
    if (widthLabel === 'mobile') {
      for (const t of audit.smallTargets) add('MEDIUM', label, widthLabel, 'touch-target-small', t);
      for (const t of audit.tinyText) add('LOW', label, widthLabel, 'text-too-small', t);
    }

    await ctx.close();
  }
  const n = findings.filter((f) => f.page === label).length;
  console.log(`  ${label.padEnd(20)} ${n === 0 ? 'clean' : `${n} finding(s)`}`);
}

await browser.close();

// --- summary --------------------------------------------------------------
const by = (s) => findings.filter((f) => f.severity === s);
console.log(`\n${findings.length} findings — HIGH ${by('HIGH').length} · MEDIUM ${by('MEDIUM').length} · LOW ${by('LOW').length}\n`);

for (const sev of ['HIGH', 'MEDIUM', 'LOW']) {
  const list = by(sev);
  if (!list.length) continue;
  console.log(`${sev}`);
  const grouped = {};
  for (const f of list) (grouped[f.type] ||= []).push(f);
  for (const [type, items] of Object.entries(grouped)) {
    console.log(`  ${type} (${items.length})`);
    for (const i of items.slice(0, 6)) {
      console.log(`    ${i.page} @${i.width}: ${i.detail}`);
    }
    if (items.length > 6) console.log(`    …and ${items.length - 6} more`);
  }
  console.log('');
}

writeFileSync('.audit-report.json', JSON.stringify({ base: BASE, at: new Date().toISOString(), findings }, null, 2));
console.log('Full report: .audit-report.json\n');
