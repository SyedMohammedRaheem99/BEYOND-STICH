/**
 * Post-deploy smoke test against the live site.
 *
 *   node scripts/verify-live.mjs                      # https://beyondstich.com
 *   node scripts/verify-live.mjs https://your-url     # a preview deployment
 *
 * Checks the things that fail silently — a customer would not see an error,
 * they would just never receive an email or never be able to pay. Everything
 * here is read-only; no order is created and no mail is sent.
 */
const BASE = (process.argv[2] || 'https://beyondstich.com').replace(/\/$/, '');

const results = [];
const record = (ok, name, detail = '') => {
  results.push({ ok, name, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

async function get(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'follow', ...opts });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, text, json };
}

console.log(`\nVerifying ${BASE}\n`);

// --- Pages render -------------------------------------------------------
console.log('Pages');
for (const [path, label] of [['/', 'home'], ['/shop', 'shop'], ['/size-guide', 'size guide']]) {
  try {
    const r = await get(path);
    record(r.status === 200, `${label} loads`, `HTTP ${r.status}`);
  } catch (e) {
    record(false, `${label} loads`, e.message);
  }
}

// --- Delivery serviceability -------------------------------------------
// Empty collections here mean every order is refused at checkout, which is
// invisible until a customer tries to pay.
console.log('\nDelivery');
try {
  const inside = await get('/api/delivery/check?pincode=560001');
  record(
    inside.json?.serviceable === true,
    'Bengaluru PIN is serviceable',
    inside.json?.etaLabel || inside.json?.reason || `HTTP ${inside.status}`
  );
  if (inside.json?.serviceable) {
    record(Boolean(inside.json.etaLabel), 'delivery estimate present', inside.json.etaLabel);
  }

  const outside = await get('/api/delivery/check?pincode=400001');
  record(
    outside.json?.serviceable === false,
    'Mumbai PIN is correctly refused',
    outside.json?.reason || 'unexpectedly serviceable'
  );
} catch (e) {
  record(false, 'delivery check reachable', e.message);
}

// --- Razorpay key alignment --------------------------------------------
// The publishable key is baked into the client bundle. If it does not match
// the secret key's mode, the server creates a live order and the browser
// opens a test checkout — payment fails at the modal with no clear reason.
console.log('\nPayments');
try {
  // The key is inlined into a client chunk at build time, not into the
  // server-rendered HTML, so the page alone never contains it — the JS
  // bundles it references have to be fetched too.
  const page = await get('/checkout');
  const scripts = [...page.text.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);

  let haystack = page.text;
  // A handful is enough: the checkout chunk is always among the page's own
  // scripts, and fetching every shared chunk would be slow and pointless.
  for (const s of scripts.slice(0, 25)) {
    try {
      haystack += (await get(s)).text;
    } catch { /* a missing chunk is not itself a failure */ }
  }

  const keys = [...haystack.matchAll(/rzp_(live|test)_[A-Za-z0-9]+/g)].map((m) => m[0]);
  const modes = new Set(keys.map((k) => (k.startsWith('rzp_live_') ? 'live' : 'test')));

  if (keys.length === 0) {
    record(false, 'publishable key reached the browser', 'not found — NEXT_PUBLIC_RAZORPAY_KEY_ID may be unset');
  } else if (modes.size > 1) {
    record(false, 'publishable key mode is consistent', 'found BOTH live and test keys');
  } else {
    const mode = [...modes][0];
    record(
      mode === 'live',
      `publishable key is ${mode}`,
      mode === 'live' ? '' : 'customers would hit a TEST checkout while the server creates LIVE orders'
    );
  }
} catch (e) {
  record(false, 'checkout page reachable', e.message);
}

// --- Auth provider gate -------------------------------------------------
console.log('\nAuth');
try {
  const p = await get('/api/auth/providers-status');
  record(p.json?.credentials === true, 'email/password sign-in enabled');
  console.log(`        google sign-in: ${p.json?.google ? 'on' : 'off (button hidden)'}`);
} catch (e) {
  record(false, 'providers-status reachable', e.message);
}

// --- Absolute URLs ------------------------------------------------------
// NEXTAUTH_URL builds password-reset links and NEXT_PUBLIC_SITE_URL builds
// the email logo src. A localhost value mails customers a dead link.
console.log('\nURLs in server-rendered output');
try {
  const html = (await get('/')).text;
  const hasLocalhost = /localhost:\d+/.test(html);
  record(!hasLocalhost, 'no localhost URLs leaked into the page');
} catch (e) {
  record(false, 'home page reachable', e.message);
}

// --- Summary ------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);

if (failed.length) {
  console.log('\nStill to fix:');
  for (const f of failed) console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
  console.log('');
  process.exit(1);
}

console.log('\nAll green. Place one real test order to confirm email end to end.\n');
