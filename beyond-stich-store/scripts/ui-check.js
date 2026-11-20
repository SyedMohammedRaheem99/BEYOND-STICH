/**
 * Visual verification for UI changes.
 *
 * Measures real rendered geometry in Chromium instead of reasoning about CSS
 * text. Written after a navbar fix shipped three times without working: the
 * logo was absolutely positioned against .navbar rather than .navInner, so
 * every "the CSS is served, it's fixed" check passed while the logo sat on
 * top of the search bar on screen.
 *
 * Usage:
 *   node scripts/ui-check.js                 # default path + widths
 *   node scripts/ui-check.js /shop 360,768
 */
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const route = process.argv[2] || '/';
const widths = (process.argv[3] || '360,400,768,1280').split(',').map(Number);
const OUT = path.join(__dirname, '..', '.ui-shots');

// Pairs that must never overlap, and elements that must stay inside the
// viewport. Selectors use the CSS-module prefix since class names are hashed.
const NO_OVERLAP = [
  ['[class*="__logo"]', '[class*="__mobileSearch"]', 'logo vs search bar'],
  ['[class*="__menuToggle"]', '[class*="__logo"]', 'hamburger vs logo'],
];

const box = (el) => (el ? el.boundingBox() : null);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;

  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    // Let the nav's entry animation settle before measuring.
    await page.waitForTimeout(800);

    const shot = path.join(OUT, `${route.replace(/\W+/g, '_')}-${width}.png`);
    await page.screenshot({ path: shot });

    console.log(`\n=== ${width}px ===`);

    for (const [aSel, bSel, label] of NO_OVERLAP) {
      const a = await box(await page.$(aSel));
      const b = await box(await page.$(bSel));
      if (!a || !b) {
        console.log(`  skip  ${label} (one side not rendered)`);
        continue;
      }
      const overlap =
        a.x < b.x + b.width && a.x + a.width > b.x &&
        a.y < b.y + b.height && a.y + a.height > b.y;
      if (overlap) {
        failures++;
        const dy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        console.log(`  FAIL  ${label} — overlapping by ${dy.toFixed(0)}px`);
        console.log(`        a: y ${a.y.toFixed(0)}..${(a.y + a.height).toFixed(0)}`);
        console.log(`        b: y ${b.y.toFixed(0)}..${(b.y + b.height).toFixed(0)}`);
      } else {
        console.log(`  ok    ${label}`);
      }
    }

    // Nothing should push the page wider than the viewport.
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollW > width + 1) {
      failures++;
      console.log(`  FAIL  horizontal overflow: ${scrollW}px > ${width}px`);
    } else {
      console.log('  ok    no horizontal overflow');
    }

    // Content must clear the fixed header rather than hide beneath it.
    // #main-content clears it with padding-top, so its own box starts at 0 by
    // design — measure the first VISIBLE child instead, which is what the
    // customer actually sees against the header.
    const clear = await page.evaluate(() => {
      const nav = document.querySelector('nav[class*="__navbar"]');
      const main = document.querySelector('#main-content');
      if (!nav || !main) return null;
      // Skip layers that are *designed* to sit under the header:
      //  - absolute/fixed children (hero bg images pinned with inset:0)
      //  - anything pulled up by a negative top margin, which is how the
      //    homepage hero deliberately bleeds behind the transparent nav
      //    (HeroSection.module.css: margin-top: calc(-1 * var(--nav-height)))
      // A wrapper div inherits its child's pulled-up top edge, so checking
      // the element's own margin is not enough — walk its ancestors up to
      // #main-content and ignore it if anything in that chain is pulled up.
      const pulledUp = (el) => {
        for (let n = el; n && n !== main; n = n.parentElement) {
          if (parseFloat(getComputedStyle(n).marginTop) < 0) return true;
        }
        return false;
      };
      const firstVisible = [...main.querySelectorAll('*')].find((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (cs.position === 'absolute' || cs.position === 'fixed') return false;
        if (r.height <= 20 || r.width <= 20) return false;
        // Descend past wrappers whose height comes from a pulled-up child.
        if (el.firstElementChild && pulledUp(el.firstElementChild)) return false;
        return !pulledUp(el);
      });
      return {
        navBottom: nav.getBoundingClientRect().bottom,
        contentTop: firstVisible ? firstVisible.getBoundingClientRect().top : null,
      };
    });
    if (clear && clear.contentTop !== null && clear.contentTop < clear.navBottom - 1) {
      failures++;
      console.log(
        `  FAIL  content starts at ${clear.contentTop.toFixed(0)}, under nav ending at ${clear.navBottom.toFixed(0)}`
      );
    } else if (clear) {
      console.log('  ok    content clears fixed header');
    }

    await page.close();
  }

  await browser.close();
  console.log(`\nscreenshots: ${OUT}`);
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})();
