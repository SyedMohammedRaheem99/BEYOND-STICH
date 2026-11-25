# Beyond Stich — How the platform works

Written 2026-11-25. Companion to `CODEMAP.md` (which says *where* code lives);
this document says *how the pieces talk to each other* and *why* it is built
this way.

---

## 1. The shape of it

There are **two separate Next.js applications** sharing **one MongoDB database**.

```
                     ┌──────────────────────────┐
                     │   MongoDB Atlas (cloud)  │
                     │  one database, ~12 colls │
                     └────────┬────────┬────────┘
                              │        │
              reads + writes  │        │  reads + writes
                              │        │
        ┌─────────────────────┴──┐  ┌──┴──────────────────────┐
        │  STORE  (:3000)        │  │  ADMIN  (:3001)         │
        │  beyond-stich-store    │  │  beyond-stich-admin     │
        │  what customers see    │  │  what only you see      │
        └──────────┬─────────────┘  └───────────┬─────────────┘
                   │                            │
          ┌────────┴────────┐          ┌────────┴────────┐
          │ Razorpay        │          │ Cloudinary      │
          │ Hostinger SMTP  │          │ (image uploads) │
          │ Cloudinary (CDN)│          └─────────────────┘
          └─────────────────┘
```

**They never call each other.** The admin does not have a "tell the store to
refresh" button and the store does not ask the admin for anything. The only
thing they share is the database. That is the whole integration.

This matters in practice: when you change a banner in the admin, the store
picks it up because the store re-reads the database — not because the admin
notified it. The store caches pages for 300 seconds (`revalidate = 300`), so a
change can take up to 5 minutes to appear. That is not a bug; it is the trade
for not hitting the database on every single visit.

### Why two apps instead of one

- The admin can never be reached from a customer URL. There is no
  `/admin` path on the store to find, guess, or brute-force.
- The admin is `robots: noindex` and sits behind an Edge middleware that
  redirects any unauthenticated request to `/login`.
- A mistake in admin code cannot take the storefront down.

The cost is **duplication**: Mongoose models and a few libraries exist in both
apps and must be kept in sync by hand. This is the single biggest maintenance
tax in the codebase (see §6).

---

## 2. The three layers in each app

Both apps are the same Next.js App Router shape. Understanding one is
understanding both.

```
  BROWSER                    SERVER                       DATABASE
  ─────────                  ──────                       ────────

  page.js  ────────────────▶  runs on the server first
  (Server Component)          queries MongoDB directly ───▶ Mongoose
                              returns finished HTML     ◀───

  ClientComponent  ──fetch──▶  /api/**/route.js  ───────▶ Mongoose
  ('use client')               validates, authorises,  ◀───
                               re-prices, writes
```

**Two different ways data reaches the screen, and the difference is important:**

1. **Server Components** (`page.js` with no `'use client'`) — run on the
   server, query MongoDB *directly* with Mongoose, and send finished HTML.
   No API route involved. Used for anything a search engine must see: the
   home page, `/shop`, product pages.
   *Example:* `src/app/page.js` calls `getHomeSections()` and `getBanners()`
   and renders them before the HTML ever leaves the server.

2. **Client Components + API routes** — run in the browser, so they must
   `fetch()` an API route to touch data. Used for anything interactive:
   adding to cart, applying a coupon, placing an order, every admin screen.

**The security consequence:** a Server Component is trustworthy because the
customer cannot interfere with it. Anything arriving at an **API route** is
attacker-controlled and must be re-validated server-side. This is why
`/api/orders` re-prices every line against the database instead of trusting
the cart total the browser sends (§4).

---

## 3. The store app (`:3000`)

### State lives in three places

| Where | What | Survives refresh? |
|---|---|---|
| **Zustand + localStorage** | cart, wishlist | Yes |
| **NextAuth session cookie** | who you are | Yes |
| **MongoDB** | products, orders, coupons, banners | Permanently |

The cart is **browser-only until checkout**. Nothing is reserved, nothing is
charged, and the server does not know about it. That is deliberate — it means
browsing and adding to cart need no account and no server round-trip.

> **Hydration note:** the cart store uses `skipHydration: true` plus a
> `StoreHydration` component. Removing either re-introduces a React hydration
> mismatch, because the server cannot know what is in a browser's
> localStorage. Do not "simplify" this.

### Authentication (NextAuth 4)

- Email + password, bcrypt-hashed (cost 12).
- **Email ownership is proved by a 6-digit OTP** before an account is usable.
  Without this, anyone could register with *your* email address and inherit
  your past guest orders — a real account-takeover path that was closed by
  moving the order-claim step to *after* OTP verification.
- Accounts created before verification existed are grandfathered: the check is
  `if (user.emailVerified === false)`, not `if (!user.emailVerified)`, so a
  missing field does not lock out an existing customer.
- Google sign-in is wired but parked.

### Orders: the critical path

```
 CART (browser)
   │
   ▼
 /checkout  ── fills address, picks COD or online
   │
   ├── COD ──────▶ POST /api/orders ──▶ Order created, stock reserved
   │                                    emails sent
   │
   └── Online ───▶ POST /api/razorpay/order   (creates a Razorpay order)
                         │
                         ├─ also writes a PendingOrder row  ◀── safety net
                         │
                   customer pays in the Razorpay modal
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
      /api/razorpay/verify    /api/razorpay/webhook
      (browser came back)     (Razorpay calls us directly)
              │                     │
              └──────────┬──────────┘
                         ▼
                 Order created once
                 (whichever arrives first wins)
```

**Why both a verify route and a webhook:** if the customer pays and then
closes the tab, loses signal, or their browser dies, the `verify` call never
happens. Razorpay's webhook arrives anyway, server-to-server, and builds the
order from the `PendingOrder` row. A `consumed` flag stops the two paths
creating the order twice. Without this, a customer could be charged with no
order to show for it.

**Both paths verify an HMAC signature** before trusting anything. The webhook
verifies against the *raw* request body — parsing the JSON first would change
the bytes and break the signature.

---

## 4. What the server never trusts

Everything below is recomputed server-side even though the browser already
sent it:

| Browser sends | Server does | Why |
|---|---|---|
| item prices | re-reads price from DB (`repriceItems`) | a tampered request could buy a ₹1,299 tee for ₹1 — especially on COD, where no gateway re-checks |
| cart total | recomputes from re-priced lines | same |
| discount | re-validates the coupon (exists, active, unexpired, min-order, first-order-only) | otherwise any string becomes free money |
| shipping | applies the business rule | currently free for all orders |
| stock | reserves it atomically *before* creating the order | stops two people buying the last tee |
| pincode | re-checks serviceability | stops a COD parcel for an address no courier reaches |

This is the part of the codebase I would change least casually.

---

## 5. The admin app (`:3001`)

- **Custom JWT auth**, not NextAuth. The token is signed with `jsonwebtoken`
  and verified in Edge middleware with `jose` (`jsonwebtoken` cannot run on
  the Edge runtime).
- Middleware guards **everything** except `/login` and `/api/auth/*`.
- **Every API route independently calls `getAdminFromRequest()`** and
  re-checks `role === 'admin'`. Middleware alone is not treated as
  sufficient — defence in depth.
- Writes go straight to the shared database; the store sees them on its next
  revalidation.

What it manages: products, product types, orders, inventory, delivery zones,
coupons, reviews, users, home page sections, banners, analytics.

---

## 6. The things that will bite you

| Risk | Why it exists | What to do |
|---|---|---|
| **Models duplicated in both apps** | no shared package | Change a model in one app → change it in the other in the same commit. Already caused a live bug (below). |
| **A missing side-effect import breaks a whole page** | `.populate('user')` needs the User schema registered; without the import mongoose throws at runtime | This took down admin orders *and* the dashboard completely (fixed 2026-11-25) |
| **5-minute cache** | `revalidate = 300` | A banner edit is not instant. Expected. |
| **`revalidate` + guest data** | cached pages must never contain per-customer data | Keep anything personal in Client Components |
| **Framer Motion animates `transform`** | it overwrites CSS transforms | Never position a Framer element with `translate(-50%,-50%)`; use `inset: 0; margin: auto` |
| **DNS under Turbopack** | `dns.setServers()` at import time does not apply | Must be called inside `connectDB()` immediately before `mongoose.connect()` |

### The lesson from the admin orders outage

Admin orders and the dashboard returned HTTP 500 on *every* request because
three routes populated `user` without importing the model. The pages caught
the error and rendered an empty list, so it looked like "there are no orders"
rather than "the request failed". 18 real orders were invisible.

**Two takeaways baked into the code now:**
1. A failed fetch must not render as empty state. Empty and broken must look
   different, or a total outage reads as "no data yet".
2. Side-effect imports need a comment saying why they are there, or someone
   removes them as unused.

---

## 7. Reading order for a newcomer

1. `CODEMAP.md` §1 — repo shape
2. This document §2 — the two data paths
3. `src/app/api/orders/route.js` (store) — the most important file; shows
   validation, re-pricing, stock reservation and email in one place
4. `src/lib/orderIntegrity.js` — why the server trusts nothing
5. `beyond-stich-admin/src/middleware.js` — how the admin is sealed off
