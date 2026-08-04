# Beyond Stich — Project Handoff & Continuation

Read this first when continuing on another device or in a new session.

## What this is
Two Next.js apps sharing one MongoDB Atlas database:
- **beyond-stich-store** — customer storefront (runs on :3000)
- **beyond-stich-admin** — admin panel (runs on :3001)

---

## ▶️ Run it on a new device
1. `cd beyond-stich-store && npm install`
2. `cd beyond-stich-admin && npm install`
3. **Recreate the env files** — they are git-ignored (secrets are NOT in the repo):
   - `beyond-stich-store/.env.local` → `MONGODB_URI=...`
   - `beyond-stich-admin/.env.local` → `MONGODB_URI=...`, `JWT_SECRET=...`, and (for image upload) `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - Use the **standard** Atlas connection string (see gotchas), not `mongodb+srv://`.
4. In **MongoDB Atlas → Network Access**, whitelist the new device's IP (or `0.0.0.0/0`).
5. First time only — seed the admin user: `cd beyond-stich-admin && node seed.js`
6. Start: storefront `npm run dev`; admin `npm run dev -- -p 3001`

**Admin login:** `admin@beyondstich.com` / `admin`

---

## ⚠️ Critical gotchas (these bit us — don't relearn them)
- **Atlas IP whitelist:** every new device/IP must be added or ALL DB ops hang ~12–30s and fail. Symptoms: slow admin, orders & coupons fail. Fix in Atlas → Network Access.
- **Use the standard connection string** (`mongodb://host1,host2,host3/db?...&replicaSet=...`), NOT `mongodb+srv://` — Node's SRV DNS lookup is refused on some networks.
- **`.env.local` is git-ignored** → recreate it on each device. Never commit secrets.
- **Mongoose 9** uses synchronous `pre()` hooks (no `next()` callback).

---

## ✅ What's DONE and working
**Storefront:** home (image-led hero + offer banner via `src/lib/banners.js`, worlds grid, trust bar, latest drop w/ prices, manifesto, newsletter), shop (search + sort + segment filter), PDP (gallery, color select, size + guide, delivery estimate, trust row, sticky mobile CTA), cart (free-ship progress, cross-sell), checkout (validation, DB coupons, address save), success page, wishlist, **/track order page**, content/legal pages, announcement bar, scroll progress, page transitions.

**Admin:** dashboard (revenue + segment performance + low-stock), products CRUD + bulk actions, orders + fulfilment (status/tracking/notes), inventory, coupons.

**DB-connected & verified:** coupons (create + validate), **orders (guest checkout → DB → admin → dashboard revenue/segments)**, order tracking, coupon usage counting, stock decrement (for real DB products).

**Honesty fixes:** removed fake "10K sold / 4.9★" stats and fake "just bought" toasts.

---

## 🟡 IN PROGRESS — paused by user
**Review system.** Built & compiling: Review model (both apps, slug-keyed + guest-friendly), storefront API `POST/GET /api/reviews`, and a real `ReviewSection` UI (submit form + star distribution + "be the first" empty state); PDP fetches real reviews.
**To resume:** (a) build an admin **/reviews** moderation page (list / verify / delete) modeled on the coupons page + add it to the admin nav; (b) decide whether to zero the demo product ratings in `dummyData.js` so cards only show real ratings.

---

## ⏭️ NEXT — pick up here
1. **Real Razorpay** (needs your `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`). Wire `/api/razorpay/order` + `verify` (HMAC signature check); set order `paymentStatus: 'paid'` only after verification; COD stays `pending`. *(Currently mock checkout marks orders `paid`.)*
2. **Delete-order** action in admin (add `DELETE` to `/api/orders/[id]` + a button on the orders page) — lets you clear the test orders.
3. **Finish reviews** (admin moderation page, above).
4. Then the **GROWTH-ROADMAP.md** phases: fit finder, faceted filters + URL state, customer accounts/auth, lifecycle email/WhatsApp, SEO (sitemap + structured data), security headers + rate limiting, PWA.

---

## 🚫 Known launch-blockers (from the code audit)
- Payments are **mocked** (mock checkout is treated as `paid` so the dashboard reflects it).
- **No customer auth** — checkout is guest; the account icon points to `/track` for now.
- `JWT_SECRET` has a dev fallback in `admin/src/lib/auth.js` — set a strong value via env in production.
- No rate-limiting, no security headers, no `sitemap.xml`/`robots.txt` yet.

## 📚 Reference docs (in beyond-stich-store/)
- **BANNER-SYSTEM.md** — image/banner sizes + AI generation prompts.
- **GROWTH-ROADMAP.md** — 10-phase growth plan (startup-smart, honesty-first, no false claims).
