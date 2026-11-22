# Site Audit — Beyond Stich

> **Status: all findings fixed.** Re-run after the fixes returns **3
> findings, all of them the 404 page correctly returning 404.**
> 149 → 3. Original report below, kept for the record.


Automated sweep of **22 page templates × 3 widths** (360 / 768 / 1440), run
against localhost on 2026-11-23 with `scripts/audit.mjs`.

Checks: horizontal overflow · console errors · failed requests · broken and
unlabelled images · touch targets · heading structure · unnamed controls ·
unreadably small text.

**149 raw findings → 9 distinct defects.** Most of the count is one fault
repeated across pages and widths — the navbar logo alone accounts for 22.

Re-run any time with:

```bash
cd beyond-stich-store
node scripts/audit.mjs                        # localhost
node scripts/audit.mjs https://beyondstich.com
```

---

## Summary

| # | Defect | Severity | Where | Effort |
|---|---|---|---|---|
| 1 | Non-serialisable data passed to client components | 🔴 HIGH | Home, Shop, Product | 20 min |
| 2 | Product page overflows 24px on desktop | 🔴 HIGH | Product @1440 | 10 min |
| 3 | Navbar logo is a 34px tap target | 🟡 MED | Every page @mobile | 10 min |
| 4 | Footer social icons are 20×28px | 🟡 MED | Every page @mobile | 10 min |
| 5 | Footer segment links are 22px tall | 🟡 MED | Every page @mobile | 10 min |
| 6 | Checkout has no `<h1>` | 🟡 MED | Checkout | 5 min |
| 7 | Small controls: password toggle, unit switch, resend | 🟡 MED | Login, Register, Size guide, Verify | 20 min |
| 8 | Carousel dots 42px (2px under) | 🟢 LOW | Home | 5 min |
| 9 | Heading levels skip h1 → h3 | 🟢 LOW | 7 pages | 15 min |

**Nothing here blocks a launch.** No broken images, no failed requests, no
page that fails to load, no layout break on mobile — the viewport-width
problems reported earlier in the cart and size guide are fixed and did not
reappear.

---

## 🔴 1. Non-serialisable data reaching client components

**30 console errors across Home, Shop and Product, at every width.**

```
Only plain objects can be passed to Client Components from Server
Components. Objects with toJSON methods are not supported.
```

Catalogue queries convert `_id` to a string but leave `createdAt` and
`updatedAt` as `Date` objects, which carry a `toJSON` method. React warns
and serialises them anyway.

Confirmed by inspecting a product document directly:

```
_id       : ObjectId   (converted)
createdAt : Date       (NOT converted)
updatedAt : Date       (NOT converted)
```

**Why it matters.** It works today, but it is React telling us the boundary
is being crossed improperly. The same values arrive as `Date` on the server
and as a string on the client, so any date formatting is a hydration
mismatch waiting to happen. It also fills the console, which hides real
errors during debugging.

**Files:** `src/app/page.js:26` · `src/app/shop/page.js:22` ·
`src/app/segment/[name]/page.js` · `src/app/product/[slug]/page.js:21`

**Fix.** A shared `serialiseProduct()` helper that converts ObjectIds and
Dates, used by every server→client hand-off.

---

## 🔴 2. Product page overflows 24px on desktop

At 1440px the document is **1464px wide** — a 24px horizontal scroll.

```css
.grid      { grid-template-columns: 55% 45%; gap: var(--space-12); }
.infoSticky { padding-right: var(--space-6); }   /* 24px */
```

55% + 45% is already 100% of the container; the gap and the right padding
then push past it. Reported against `.infoCol` and `.infoSticky`, +24px each.

**Why it matters.** A horizontal scrollbar on the page customers spend most
of their time on reads as a broken layout, and it shifts content as they
scroll.

**File:** `src/app/product/[slug]/page.module.css:37-58`

**Fix.** `grid-template-columns: minmax(0, 55fr) minmax(0, 45fr)` so the
columns share the space the gap leaves, and move the padding inside the
sticky element's own box.

---

## 🟡 3. Navbar logo is a 34px tap target

`120 × 34px` on mobile — below the 44px minimum, on **every page**. The
single largest contributor to the raw finding count (22 of 141).

It is the "go home" control, tapped constantly.

**File:** `src/components/layout/Navbar.module.css` — `.logo` / `.logoImage`

**Fix.** Vertical padding on the anchor to reach 44px without changing the
wordmark's rendered size.

---

## 🟡 4. Footer social icons are 20×28px

```css
.socials a { color: …; transition: …; }   /* no padding, no min size */
```

A 20px-wide target is difficult to hit accurately on a phone, and these are
the links to your Instagram — the one place a customer goes to check the
brand is real.

**File:** `src/components/layout/Footer.module.css:130`

**Fix.** `display: flex; min-width: 44px; min-height: 44px;` with the icon
centred, so the painted size stays the same.

---

## 🟡 5. Footer segment links are 22px tall

`336 × 22px` for GYM, COFFEE, MILLIONAIRE and the rest. Full-width, so
they are easy to hit horizontally, but vertically they sit half the
minimum and the rows are close enough together to mis-tap.

**File:** `src/components/layout/Footer.module.css`

**Fix.** Vertical padding on the link, which also opens up the list.

---

## 🟡 6. Checkout has no `<h1>`

Every other page has one. A page with no top-level heading is harder to
navigate with a screen reader, and weaker for SEO — though checkout is
`noindex`, so the accessibility point is the real one.

**File:** `src/app/checkout/page.js`

**Fix.** A visually-hidden `<h1>CHECKOUT</h1>`, matching how the home page
already handles this.

---

## 🟡 7. Small controls, individually

| Control | Size | Page |
|---|---|---|
| Show/hide password | 26×26 | Login, Register |
| INCHES / CM toggle | 79×36, 52×36 | Size guide |
| Resend code | 96×34 | Verify email |
| Colour swatch | 42×42 | Product |
| Breadcrumb links | 26×18 … 63×18 | Product |
| LOGOUT | 75×40 | Account |
| SHOP NOW | 142×39 | Shop banner |

All close to the minimum rather than badly wrong, but the password toggle
at 26×26 is the one a customer will actually miss.

---

## 🟢 8. Carousel dots are 42px

Already have a `::after` hit-area expander — 2px short of 44. Trivial.

**File:** `src/components/home/HeroSection.module.css:247`

---

## 🟢 9. Heading levels skip h1 → h3

Seven pages. Six are the footer's newsletter `<h3>` appearing on a page
whose only other heading is the `<h1>`; the seventh is the product page's
`COLOR` heading.

Purely structural — nothing looks wrong. Worth fixing for screen-reader
navigation, not urgent.

---

## What was checked and found clean

- **No broken images** anywhere
- **No failed network requests** (the 404 page's own 404 excepted)
- **No page failed to load** at any width
- **No horizontal overflow on mobile** — the cart drawer and size guide
  faults fixed earlier did not reappear
- **No text below 11px**
- **All images have alt text**
- **Every form control has an accessible name**

---

## Suggested order

**Phase A — the two HIGH items (~30 min).** Serialisation and the product
page overflow. Both are real defects on the pages customers see most.

**Phase B — touch targets (~40 min).** Items 3-5 and 7. One pass over the
navbar, footer and the handful of individual controls. Biggest real-world
improvement for mobile traffic, which is most of yours.

**Phase C — structure (~20 min).** Checkout `<h1>`, heading levels, dots.
Accessibility and SEO polish.

---

## Not covered by this audit

The harness checks what can be measured on a loaded page. It does **not**
cover:

- **Checkout and payment end to end** — needs a real Razorpay transaction
- **Email delivery** — covered separately by `scripts/verify-live.mjs`
- **The admin panel** — behind auth, needs a session
- **Visual design judgement** — spacing, hierarchy, whether something
  simply looks wrong
- **Colour variants** — the known gap where selecting a colour does not
  change the product images

Those need either a human or a different kind of test.
