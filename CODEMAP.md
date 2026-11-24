# Beyond Stich — Code Map

**Purpose:** a navigation index so any future change goes straight to the right file
and line without re-reading the codebase. Written 2026-11-18 against commit `cb130d8`; updated 2026-11-23 (admin-managed home page, §16).

**Companion docs (not duplicated here):**

| File | What it holds |
|---|---|
| `AUDIT.md` | UI/UX audit findings, keyed `C1`, `T3`, `P1`… |
| `DESIGN-DIRECTION.md` | Art direction, token rationale, WCAG contrast table |
| `CHANGELOG-UI.md` | Phase-by-phase log of UI changes already shipped |
| `SEO-AUDIT.md`, `KEYWORD-MAP.md`, `CONTENT-PLAN.md` | SEO/content strategy |
| `ROADMAP.md`, `GROWTH-ROADMAP.md` | Planned work |
| `BANNER-SYSTEM.md` | Banner asset spec |

---

## 1. Repo shape

```
Beyond_stich/
├── beyond-stich-store/     ← customer storefront  (next dev, :3000)
├── beyond-stich-admin/     ← admin panel          (next dev -p 3001)
├── assets-logo/ design-assets/ images/ docs/ scripts/
└── *.md                    ← strategy + audit docs (above)
```

Two **separate Next apps sharing one MongoDB database**. Mongoose models are
*duplicated* in both apps and must be kept in sync — see §9.

### Stack
Next **16.2.11** (App Router) · React **19.2.4** · Mongoose 9 · NextAuth 4 (store)
· custom JWT + `jose` (admin) · Zustand 5 + persist · Framer Motion 12 · Razorpay
· Resend (email) · Cloudinary (image upload) · CSS Modules (no Tailwind in store;
Tailwind 4 is installed in admin) · Playwright (dev-only, UI screenshots).

> `beyond-stich-store/CLAUDE.md` → `@AGENTS.md`, which warns: **this Next version has
> breaking changes vs. training data — check `node_modules/next/dist/docs/` before
> writing new framework-level code.**

---

## 2. Design system — `beyond-stich-store/src/app/globals.css` (446 lines)

**Every visual change starts here.** Single token file; no Tailwind, no theme provider.
Tokens are heavily commented with *why* each value exists — read the comment before
changing a value.

| Lines | Block | Key tokens |
|---|---|---|
| 10–17 | CSS reset | `box-sizing: border-box` globally |
| 20–40 | **Colors** | `--color-bg #0A0A0A`, `-bg-secondary`, `-bg-card #151515`, `-bg-elevated`, `--color-surface`, `--color-border #2A2A2A`, `-border-hover` |
| 31–40 | Text | `--color-text-primary #F8F8F8`, `-secondary #A0A0A0`, `-muted #8A8A8A` (AA on *all four* surfaces — don't lower it), `-accent #FFF` |
| 42–49 | Semantic | `--color-success #22C55E`, `--color-error #EF4444`, `--color-error-bg/-border` |
| 51–64 | **Segment accents** | `--accent-gym` … `--accent-randoms` (13) |
| 66–75 | **Brand accent** | `--accent #F5C518` + `--accent-ink`, `--accent-soft`, `--accent-line`. **Rule: yellow = "act". Nothing else is yellow.** Segment colors are hairlines/labels/tiles only — never fills, never CTAs. |
| 81–84 | Fonts | `--font-display` (Barlow Condensed), `--font-body` (Space Grotesk) |
| 86–101 | **Type scale** | `--text-2xs` (11px, badges only) → `--text-6xl`, `--text-hero` |
| 103–109 | Fluid display | `--display-sm/-md/-lg/-xl` — use these, not new `clamp()` |
| 111–116 | Tracking | `--tracking-tight/-normal/-wide` (only 3 allowed) |
| 118–140 | **Spacing** | `--space-px`, `-0-5`, `-1` … `-32` |
| 142–149 | **Section rhythm** | `--section-y`, `--section-y-tight` — every full-width section uses these |
| 151–157 | Radius | `--radius-sm 4px` → `-xl 16px`, `-full` |
| 159–165 | Motion | `--ease-out`, `--ease-in-out`, `--duration-fast/-normal/-slow` |
| 167–170 | Overlays | `--overlay-bg`, `-heavy` |
| 172–186 | **Elevation** | `--shadow-sm/-md/-lg` (+ `-card`/`-elevated` aliases). Glow shadows were deliberately removed — don't reintroduce. |
| 188–207 | **Layout** | `--nav-height 70px`, `--announce-height 36px`, `--header-height` (sum), `--container-max 1600px`, `--container-padding`, `--tabbar-height 60px` |
| 209–226 | **Z-index scale** | `--z-sticky 100` · `-fab 899` · `-sticky-bar 900` · `-tabbar 950` · `-navbar 1000` · `-announce/-overlay 1001` · `-drawer 1002` · `-modal 2000` · `-modal-content 2001` · `-toast 9000` · `-fullscreen 10000` · `-cursor 99999` |
| 233–238 | `.app-main` mobile pad | reserves `--tabbar-height` + safe-area |
| 241–300 | Base styles | `body`, `a`, `button`, `img`, global `input/textarea/select` styling |
| 302–350 | **A11y** | `:focus-visible` yellow ring, `.sr-only`, `.skip-link`, `prefers-reduced-motion` block |
| 352–383 | Type utilities | `.font-display`, `.text-hero`, `.text-heading`, `.text-label` |
| 385–392 | `.container` | max-width + padding wrapper (used everywhere) |
| 394–410 | `.noise-overlay` | inline-SVG grain, `::after` |
| 412–428 | Scrollbar | webkit thumb styling |
| 435–446 | **Responsive token overrides** | `@768px`: nav 60px, announce 32px, padding `--space-4`; `@480px`: padding `--space-3` |

**Where to make common changes**
- Brand color / CTA color → `--accent` (~line 73)
- Page width → `--container-max` (~line 198)
- Vertical page rhythm → `--section-y` (~line 146)
- Nav height (affects `paddingTop` of `<main>`) → `--nav-height` (~line 189)
- A new overlay layer → add to the z-scale, don't invent a number

---

## 3. App shell (store)

| File | Role | Notes |
|---|---|---|
| `src/app/layout.js` (84) | Root server layout | `next/font` → `--font-display-src`/`--font-body-src`; `viewport` with `viewportFit: 'cover'` (needed for `env(safe-area-inset-*)`); global `metadata` + OG/Twitter; mounts 3 SEO schema components; loads Razorpay `checkout.js` via `<Script strategy="lazyOnload">`; `<noscript>` opacity reset |
| `src/app/ClientLayout.js` (50) | Client shell | `<MotionConfig reducedMotion="user">` → `<SessionProvider>` → `StoreHydration`, skip-link, `PageLoader`, `AnnouncementBar`, `Navbar`, `CartDrawer`, `<main id="main-content" class="app-main" paddingTop=var(--header-height)>`, `Footer`, `WhatsAppWidget`, `BottomTabBar` |
| `src/app/template.js` (14) | Per-route transition | **Opacity-only on purpose** — a transform here creates a containing block and breaks the PDP's `position: sticky` gallery |
| `src/app/loading.js` / `error.js` / `global-error.js` / `not-found.js` | Route-level states | `global-error.js` has inline styles (no CSS modules available there) |
| `src/app/robots.js` (14) | robots.txt | Disallows `/api/`, `/account/`, `/checkout/`, auth routes; allows `/api/feed/` |
| `src/app/sitemap.js` (80) | Sitemap | static + 13 segments + DB products + blog; falls back to `DUMMY_PRODUCTS` |

**Add a global overlay/widget → `ClientLayout.js`. Add a meta/script → `layout.js`.**

---

## 4. Routes (store) — 28 pages

### Commerce
| Route | Files | Notes |
|---|---|---|
| `/` | `app/page.js` (78) | Server. `revalidate = 300`. `getLatestDrops()` queries DB direct (6 newest), falls back to dummy. Visually-hidden `<h1>` for SEO. `Promise.all([getLatestDrops(), getHomeSections(), getBanners('home-hero')])`. Composes: `HeroSection` (DB banners, falls back to `HERO_SLIDES`) → `TrustBar` → `LatestDrop` → **`ProductSection` × N (admin-managed, §16)** → `SegmentGrid` → `OfferBanner` → `BrandManifesto` → `SocialProofBar` |
| `/shop` | `page.js` (91) + `ShopClient.jsx` (250) + `page.module.css` (359) + `layout.js` | Fetches `getBanners('shop-hero')` and threads it through `ShopClient` → `ShopBanner`. `ShopClient`: `SORT_OPTIONS` (L12), `TRUST_ITEMS` (L20), segment pills, search (`?q=`), client-side text filter, skeleton + `loadError`/retry states |
| `/product/[slug]` | `page.js` (121) + `ProductDetailClient.jsx` (423) + `page.module.css` (700) + `layout.js` (57) | See §5 |
| `/segment/[name]` | `page.js` (73) + `SegmentClient.jsx` (75) + `page.module.css` (182) + `layout.js` | Driven by `SEGMENTS` in constants |
| `/checkout` | `page.js` (786) + `page.module.css` (738) + `layout.js` + `error.js` | See §6 |
| `/checkout/success` | `page.js` (131) | Reads `sessionStorage['bs_last_order']` |
| `/track` | `page.js` (194) + `page.module.css` (284) + `layout.js` | Public order lookup, deliberately indexable |

### Account (all under `app/account/`, `layout.js` guards auth)
`layout.js` (84) holds `ACCOUNT_NAV` (L8–19). **Note:** `/account/wishlist` is
intentionally exempt from the auth redirect (wishlist works from localStorage).
Pages: `page.js` (dashboard, 119) · `orders/page.js` (183) · `orders/[orderNumber]/page.js` (278)
· `profile/page.js` (206) · `addresses/page.js` (242) · `wishlist/page.js` (65).

### Auth
`/login` (130) · `/register` (174) · `/forgot-password` (89) · `/reset-password/[token]` (116).
Each has a sibling `layout.js` for metadata/noindex.

### Content / info (all use `InfoPageLayout`, fully static server components)
`/about` (175) · `/contact` (61) · `/faq` (100) · `/size-guide` · `/shipping` (81)
· `/returns` (82) · `/terms` (118) · `/privacy` (111) · `/stores/bangalore` (190)
· `/blog` (55) + `/blog/[slug]` (192).

---

## 5. PDP — `app/product/[slug]/`

**`page.js` (121) — server, `revalidate = 300`**
- `getProduct(slug)` L15–27 — **DB answer is final; a miss 404s.** Dummy fallback only on a thrown DB error.
- `getRelated(slug, segment)` L30–42 — 4 same-segment siblings; empty is a valid answer.
- `getReviews(slug)` L45–73 — **never projects `authorEmail`** (public HTML). Never invents reviews on error.
- L85–96: `averageRating`/`reviewCount` are **overwritten from real approved reviews** — never emit `aggregateRating` without genuine reviews (Google manual-action risk).
- Renders `ProductSchema` + `BreadcrumbSchema`, then `ProductDetailClient`.

**`ProductDetailClient.jsx` (423) — the big interactive island**

| Lines | Block |
|---|---|
| 17–33 | State: `selectedSize`, `selectedColor`, `notifySize/Email/Msg`, `sizeGuideOpen`, `pincode`, `delivery`, `added` |
| 35–41 | `accentColor` (segment), `isWishlisted`, `discount`, `selectedSizeStock` |
| 43–48 | `handleAddToCart` — guards `selectedSizeStock <= 0` |
| 50–68 | `submitNotify` → `POST /api/notify-stock` |
| 70–85 | `checkDelivery` — **heuristic only** (`/^[14578]/` → 3 days else 6), no real pincode API |
| 92–98 | `fetchReviews` refetch after submit |
| 104–114 | Breadcrumb |
| 117–121 | Left col: `ProductGallery` (sticky) |
| 128–146 | Title / price / discount |
| 148–157 | Social proof stars |
| 159–185 | Color swatches |
| 187–245 | **Size grid** — sold-out sizes are *selectable* (they open notify-me), not disabled |
| 206–228 | Notify-me restock form |
| 247–275 | Add-to-bag + wishlist buttons |
| 277–312 | **Estimated delivery block — hardcoded inline styles, +3/+6 days, hardcoded `#22C55E` and `11px`** (token-system violation; known cleanup target) |
| 314–345 | Pincode check form |
| 347–366 | Trust row (returns link, COD, secure) |
| 368–383 | Details: THE DROP / MATERIAL & BUILD / SHIPPING |
| 385–395 | `ReviewSection` |
| 400–416 | "You may also like" grid |
| 419–423 | `SizeGuideModal` |
| 425–452 | **Mobile sticky add-to-cart bar** — if no size, scrolls to `#pdp-sizes` |

`page.module.css` (700) — largest stylesheet. `.stickyBar` sits at `--z-sticky-bar` (900).

---

## 6. Checkout — `app/checkout/page.js` (786) + `page.module.css` (738)

A 3-step single-page flow. **Highest-risk file in the repo — read the comments.**

| Lines | Block |
|---|---|
| 12–16 | `STEPS = { ADDRESS, SUMMARY, PAYMENT }` |
| 18–27 | `EMPTY_FORM` (firstName, lastName, email, phone, address, city, state, pin) |
| 29–30 | Storage keys: `ADDRESS_KEY = 'bs_checkout_address'` (localStorage), `ORDER_KEY = 'bs_last_order'` (sessionStorage) |
| 32–43 | `validate(form)` — client mirror of server rules (10-digit phone, 6-digit PIN) |
| 46–78 | State incl. `cartNotices`, `availableCoupons`, `savedAddresses`, `paymentMethod` (**defaults `'online'`**) |
| 80–86 | Restore saved address from localStorage |
| 88–97 | Fetch `/api/coupons` for offer chips |
| 99–107 | **`syncWithServer()` once `hydrated`** — reconciles stale cart before showing totals |
| 109–130 | Prefill from session + fetch `/api/user/addresses` |
| 132–142 | `applySavedAddress` |
| 144–149 | **Totals** — `total = max(0, subtotal - couponDiscount) + shipping` |
| 151–154 | `handleInputChange` |
| 156–187 | `applyCoupon` → `POST /api/coupon/validate` (sends email for first-order-only) |
| 189–193 | `removeCoupon` |
| 195–215 | `handleAddressSubmit` — on error, focuses + scrolls to `#checkout-<field>` |
| 217–240 | `buildOrderPayload()` |
| 242–263 | `saveOrderAndRedirect` — **prefers server figures over client cart figures** |
| 268–276 | `handlePay` — `if (placingOrder) return` double-tap guard |
| 278–302 | **COD path** → `POST /api/orders` with `paymentMethod: 'cod'` |
| 304–330 | **Razorpay path** → `POST /api/razorpay/order` (sends cart, *never* a total) |
| 332–348 | Mock path (no keys) → `POST /api/orders` |
| 350–360 | Razorpay modal options; `theme.color: '#C6A14A'` (**note: not `--accent`**) |
| 362–388 | `handler` → `POST /api/razorpay/verify` → redirect |
| 389–394 | `modal.ondismiss` resets state |
| 396–408 | `payment.failed` listener (declined cards) |
| ~410+ | JSX: notices banner, step indicator, address form, saved-address chips, summary, coupon UI, payment selector, order error |

---

## 7. State — `src/lib/store.js` (330), Zustand + persist

### `useCartStore` (L9–201) — localStorage key `beyond-stich-cart`
- `items`, `isOpen`, **`hydrated`** (false until localStorage restored)
- `openCart` / `closeCart` / `toggleCart`
- `addItem(product, size, color='Black')` L25–71 — dedupes on `productId|size|color`; **replaces the item object** (not just the array) so subscribers update; clamps to `maxStock` (per-size stock captured at add time)
- `removeItem` L74–86 · `updateQuantity` L89–108 (clamps to `maxStock`)
- **`syncWithServer()` L116–172** → `POST /api/cart/validate`; returns plain-language notices; handles `unavailable`/`out_of_stock`/`low_stock`/`price_changed`; never blocks checkout on failure
- `clearCart`, `itemCount` getter, `getSubtotal`, `getSavings`, `getShipping` (uses `SHIPPING`), `getTotal`
- **`skipHydration: true`** + `onRehydrateStorage` sets `hydrated` — this is what fixed the hydration flash. **Do not remove.**

### `useWishlistStore` (L206–297) — key `beyond-stich-wishlist`
`addToWishlist` / `removeFromWishlist` / `isInWishlist` / `clearWishlist`,
`syncToServer()` (fire-and-forget `PUT /api/user/wishlist` with slugs),
`loadFromServer()` (server wins on dupes). Also `skipHydration: true`.

### `useUIStore` (L302–330)
`isLoading`/`setLoading`. **`setCursorVariant`/`setCursorText`/`resetCursor` are
deliberate no-ops** — the custom cursor was removed but ~8 components still call
them on hover. Deleting them throws on first mouseover.

### `components/layout/StoreHydration.jsx` (39)
Mounted in `ClientLayout`. Calls `persist.rehydrate()` for both stores after first
render, and `loadFromServer()` once authenticated. **Renders nothing.**

---

## 8. Constants — `src/lib/constants.js` (238) · single source of truth

| Export | Lines | Notes |
|---|---|---|
| `BRAND` | 6–21 | `name`, `tagline`, `url`, `email`, **`phone` / `phoneE164`** (wa.me), **`instagram` / `instagramHandle`**. Previously hardcoded in 5 files and all wrong — always read from here |
| `SEGMENTS` | 23–160 | **13 segments**, each `{ id, name, tagline, accent, description, longDescription }`. Drives nav mega-menu, mobile menu, footer, shop pills, segment pages, sitemap. **Add a segment here and it appears everywhere.** |
| `SIZES` | 162 | `['S','M','L','XL','XXL']` |
| `COLOR_HEX` + `getColorHex()` | 165–180 | 11 named colors → hex for swatches |
| `SEGMENT_IMAGES` + `getSegmentImage()` | 186–205 | local WebP per segment (`/banners/segments/*.webp`) |
| `FIT_TYPES` | 207 | Oversized / Super Oversized |
| `ORDER_STATUSES` | 209–217 | placed → confirmed → shipped → out_for_delivery → delivered (+ cancelled, returned) |
| `PAYMENT_STATUSES` | 219 | pending / paid / failed / refunded |
| `ORDER_STATUS_COLORS` + `getOrderStatusColor()` | 223–236 | was duplicated in 2 pages |
| **`SHIPPING`** | 239–242 | `FREE_THRESHOLD: 999`, `FLAT_RATE: 79` |
| **`WELCOME_TIERS`** | 246–251 | `LOWER_MIN 949`/10%, `UPPER_MIN 1999`/25%. **Must match `minOrder` on the `WELCOME10`/`WELCOME25` coupons in the DB** or the site promises a discount checkout refuses |
| `LOW_STOCK_THRESHOLD 6` / `SIZE_LOW_STOCK_THRESHOLD 3` | 254–255 | card badge / PDP "X Left" |
| `getSegmentByName`, `getSegmentAccent` | 257–267 | |

Other libs: `lib/utils.js` (19 — `discountPercent`, `totalStock`, `isInStock`; safe
in client *and* server) · `lib/banners.js` (146 — `HERO_SLIDES`, shop slides; **any
coupon code shown here must exist in the DB**) · `lib/blog.js` (107 — `BLOG_POSTS`
registry with full body text) · `lib/dummyData.js` (seed fallback) · `lib/data/products.js`.

---

## 9. Data models — `src/lib/models/` (⚠️ duplicated in admin, keep in sync)

| Model | Lines | Key fields / notes |
|---|---|---|
| `Product.js` | 131 | `name, slug (unique), segment (enum of 13), price, mrp, images[], sizes[{size,stock}], colors[], description, fitType, material, tags[], averageRating, reviewCount, viewCount, isActive`. Virtuals `discountPercent`, `totalStock`. Indexes incl. compound `{isActive, segment, createdAt}`. **`slug`/`email` not re-indexed — `unique:true` already does it** |
| `Order.js` | 102 | `user` (nullable → guest), `email`, `orderNumber` (auto `BS-<ts36>-<rand>` in `pre('validate')`, L77–84), `items[]` (**slug-based**), `shippingAddress`, `subtotal/discount/shipping/total`, `couponCode`, `paymentMethod ['cod','online','mock']`, `paymentId`, `razorpayOrderId`, `paymentStatus`, `orderStatus`, `trackingNumber`, refund fields, **`returnRequest {status, reason, requestedAt, resolvedAt}`**, `deliveredAt`. 6 indexes incl. sparse `razorpayOrderId` |
| `PendingOrder.js` | 36 | **The webhook safety net.** Stores the cart against `razorpayOrderId` so the webhook can build an order without the browser. `consumed` flag prevents double-creation. TTL **86400s** |
| `User.js` | 77 | `name, email (unique), phone, passwordHash (select:false), image, provider ['credentials','google'], role ['customer','admin'], addresses[AddressSchema], wishlist[→Product], resetToken/resetTokenExpiry (select:false)` |
| `Review.js` | 27 | `productSlug` (slug-keyed), `authorName`, `authorEmail`, `rating 1–5`, `title`, `body`, `images[≤5]`, **`verified`** (matched to a real order), **`approved`** (moderation gate) |
| `Coupon.js` | 24 | `code (unique, uppercase)`, `type ['percent','flat','shipping']`, `value`, `minOrder`, `maxDiscount`, `active`, `usageLimit`, `usedCount`, `expiresAt`, **`firstOrderOnly`** |
| `HomeSection.js` | 69 | **Admin-managed home page product strip.** `title, eyebrow, subtitle`, `source ['manual','tag','segment','newest']` + the one selector it uses (`productSlugs[]` / `tag` / `segment`), `limit (1–24)`, `layout ['grid','carousel']`, `linkLabel/linkHref`, `sortOrder`, `active`, `startsAt/endsAt`. `pre('validate')` rejects a source whose selector is missing |
| `Banner.js` | 61 | **Admin-managed hero slide.** `placement ['home-hero','shop-hero']`, `desktopImage` (required), `mobileImage`, `badge/headline/subheadline`, `ctaLabel/ctaHref`, `code` (advertised coupon), **`accent`** (6-digit hex, validated; shop banner overlay + CTA tint), `sortOrder`, `active`, `startsAt/endsAt` |
| `Newsletter.js` | 18 | `email (unique)`, `subscribedAt`, `active` |
| `StockNotification.js` | 25 | `productSlug + size + email` (compound unique), `notified` |

`lib/mongodb.js` (55) — cached global connection; **forces public DNS resolvers
(8.8.8.8 / 1.1.1.1)** at L1–4 because local DNS often blocks `mongodb+srv` SRV
lookups; `serverSelectionTimeoutMS: 12000` to fail fast.

---

## 10. API routes (store) — `src/app/api/`, 23 routes / 1955 lines

### Order & payment integrity — read these together
**`src/lib/orderIntegrity.js` (145) is the shared core. Never bypass it.**
- `MAX_ITEMS = 50` · `OrderError` (→ 409, customer-actionable)
- `isValidEmail` · `validateShippingAddress` (L17–32 — `^[1-9][0-9]{5}$` pincode, `^[6-9][0-9]{9}$` phone; a COD parcel with a bad phone is undeliverable at our cost)
- `pickShippingAddress` (L35–45 — allowlists + length-bounds fields)
- **`repriceItems(items)` (L51–85)** — re-reads every price from the DB. Fails *closed*. Without it a ₹799 tee could be bought for ₹1
- **`computeTotals(items, couponCode, email)` (L89–109)** — discount + shipping are business rules, **never client inputs**
- **`reserveStock(items)` (L116–134)** — atomic `$inc` guarded by `$elemMatch stock >= qty`, so two checkouts for the last tee can't both win. Returns the sold-out line after rolling back
- `releaseStock(items)` (L137–145)

| Route | Lines | Notes |
|---|---|---|
| `orders/route.js` | 192 | **GET** — matches `$or: [{user}, {email}]` (guest orders have `user: null`; id-only made them invisible). **POST** — validate → `repriceItems` → `computeTotals` → `reserveStock` → `Order.create` → coupon `$inc` → fire-and-forget emails. **Always writes `paymentStatus: 'pending'`** — this route takes no money |
| `razorpay/order/route.js` | 122 | Creates the gateway order. **Amount computed server-side from the cart.** Mock order returned when keys are unset (server-decided only). Writes the `PendingOrder` |
| `razorpay/verify/route.js` | 185 | **HMAC check `sha256(order_id\|payment_id)` L55–65.** `isMock` is **server-config only** (a client-supplied `mock_` prefix used to bypass verification). Dedupes vs. the webhook by `razorpayOrderId`, claims the `PendingOrder`, then full integrity pipeline → `paymentStatus: 'paid'` |
| `razorpay/webhook/route.js` | 175 | **Uses `request.text()` raw body** (re-serializing JSON breaks the signature). `crypto.timingSafeEqual` with a length pre-check. Only `payment.captured`. Atomically claims the `PendingOrder` via `findOneAndUpdate({consumed:false})`. Logs **`PAID BUT UNFULFILLABLE`** / **`PAID BUT OUT OF STOCK`** for manual review. Returns 500 (→ retry) only on transient faults |
| `cart/validate/route.js` | 85 | Returns current truth per line: `ok` / `unavailable` / `out_of_stock` / `low_stock` / `price_changed` |
| `coupon/validate/route.js` | 30 | **Advisory only** — `resolveCoupon` runs again at order time |
| `coupons/route.js` | 48 | Public offer list, `revalidate = 300`, max 6; never leaks `usedCount`/limits |
| `products/route.js` | 122 | Public catalogue. `SORT_MAP` L6–18 (**`discount` sorted in memory** — it's derived from mrp/price). Caps at `min(limit,100)` or 48. `featured` matches tag **or** boolean. **An empty DB result is a valid answer** — no dummy fallback except on a thrown error (`getDummyFallback` L104–122) |
| `reviews/route.js` | 124 | GET never projects `authorEmail`; returns average + 5→1 distribution. POST rate-limited 5/hr; **`approved = verified`** — auto-publishes only when the email matches a real order for that slug |
| `orders/track/route.js` | 62 | Public lookup by orderNumber + email/phone |
| `orders/[orderNumber]/route.js` | 50 | Single order (owner-scoped) |
| `orders/[orderNumber]/return/route.js` | 92 | Customer-initiated return; 7-day window from `deliveredAt` |
| `auth/[...nextauth]/route.js` | 6 | Re-exports `authOptions` |
| `auth/register` / `forgot-password` / `reset-password` | 68 / 54 / 49 | Rate-limited; reset token hashed + expiring |
| `user/profile` / `password` / `addresses` / `wishlist` | 58 / 64 / 132 / 57 | Session-guarded |
| `newsletter/route.js` | 31 | Upsert by email |
| `notify-stock/route.js` | 55 | Restock request (compound-unique) |
| `feed/google/route.js` | 94 | Google Merchant product feed (allowed in robots.txt) |

**`lib/coupon.js` (99) — `resolveCoupon(code, subtotal, email)`.** Single source of
truth for coupon rules: active → not expired → under usage limit → meets `minOrder`
→ **`firstOrderOnly` checked against past non-cancelled orders for that email** →
compute (percent capped by `maxDiscount` / flat / shipping) → clamp `discount ≤ subtotal`.

**`lib/rateLimit.js` (54)** — in-memory buckets, `clientKey(request)` from
`x-forwarded-for`. **Best-effort only** (serverless instances don't share memory);
move to Redis/Upstash if abuse gets targeted.

**`lib/auth.js` (109)** — NextAuth: Credentials (bcrypt) + Google (**conditionally
registered only if both env vars exist**, L37–45). `signIn` callback links/creates a
Google user; `jwt`/`session` callbacks propagate `id` + `role`. JWT strategy, 30-day
maxAge. **No secret fallback — deliberate.**

**`lib/email.js` (345)** — Resend. No-ops with a log line when `RESEND_API_KEY` is
unset. `sendOrderConfirmation`, `sendNewOrderAlert`, + password-reset/return mails.
Dark inline-styled HTML templates.

---

## 11. Components (store) — `src/components/`

### `layout/`
| File | Lines | Notes |
|---|---|---|
| `Navbar.jsx` | 373 | `scrolled` (>50px), `mobileMenuOpen`, `searchOpen`, `worldsOpen`. Escape closes all (L44–54); body-scroll lock while menu open (L58–67); `onBlur` closes the WORLDS mega-menu for keyboard users (L113–117); `aria-current` on active links. **Logo uses a hand-tuned `<img srcSet>` 1x/2x/3x — intentionally not `next/image`** (L170–190). Mobile side menu puts **help links above the 13 segments** (L310–330); segments mapped from `SEGMENTS` |
| `Navbar.module.css` | 558 | 2nd-largest stylesheet |
| `CartDrawer.jsx` | 308 | `useFocusTrap`, Escape, body-scroll lock, focus-to-close-button (L28–47). Cross-sell fetch `?featured=true&limit=6` minus in-cart (L50–61). Free-shipping progress bar + **welcome-tier nudge** (L110–120) |
| `Footer.jsx` | 174 | Newsletter form → `POST /api/newsletter`; segments + links from `constants` |
| `BottomTabBar.jsx` | 98 | **Mobile only.** 4 tabs: Home / Shop / Cart / Account. Local SVG icon components |
| `AnnouncementBar.jsx` | 60 | `MESSAGES` L16–23, rotates every 3500ms. **Only claims we can honour — every code must exist in the DB** |
| `PageLoader.jsx` | 76 | Initial load veil |
| `InfoPageLayout.jsx` | 29 | **Server component** — heading animation is pure CSS so 8 info pages ship zero JS |
| `StoreHydration.jsx` | 39 | See §7 |

### `product/`
| File | Lines | Notes |
|---|---|---|
| `ProductCard.jsx` | 181 | **The one shared card.** Guards every optional field (wishlist items carry a trimmed product, L20–31). Badge priority: SOLD OUT → LOW STOCK → NEW DROP. **Uses `loading="eager"` + `fetchPriority`, deliberately not `priority`/`preload`** — multiple cards could be LCP depending on viewport (L72–90). Motion deliberately restrained; stagger capped at 3 |
| `ProductGallery.jsx` | 170 | Sticky gallery, thumbnails, zoom overlay (`--z-fullscreen`) |
| `ReviewSection.jsx` | 212 | Distribution bars, submit form, optimistic refetch |
| `SizeGuideModal.jsx` | 113 | Focus-trapped modal |

### `home/`
`HeroSection.jsx` (249 — carousel over the `banners` prop (DB), **falling back to
`HERO_SLIDES`** when none are live; `AUTOPLAY_INTERVAL = 6750`; pauses on
hover/focus; **stops entirely under `useReducedMotion`**; touch swipe)
· **`ProductSection.jsx` (55 — admin-managed product strip, §16)**
· `TrustBar` (71) · `LatestDrop` (74 — the only `Section` + `Skeleton` consumer)
· `SegmentGrid` (89 — tiles from `SEGMENTS`, **excludes `randoms`**, `getTileSize(i)`)
· `OfferBanner` (99) · `ShopBanner` (~175 — **shop promo carousel, reads the `banners` prop (DB `shop-hero`)**, falls back to `SHOP_BANNERS` + its local `IMAGES` map; `AUTOPLAY_INTERVAL = 6000`; uses each slide's `accent`) · `BrandManifesto` (54) · `SocialProofBar`.

### `ui/` primitives — **built but under-adopted (known debt)**
| Primitive | Lines | Current consumers |
|---|---|---|
| `Button.jsx` | 111 | **4 files** — `about`, `BrandManifesto`, `HeroSection`, `LatestDrop`. Auto-renders `<a>`/`next/link`/`<button>` from `href`; variants primary/secondary/ghost/danger; sizes sm/md/lg (all ≥44px); `loading` preserves label box |
| `Section.jsx` | 56 | **1 file** — `LatestDrop` |
| `Input.jsx` | 92 | **0 files** — wires label/`aria-invalid`/`aria-describedby`/live errors + icon |
| `EmptyState.jsx` | — | 2 files (`account/orders`, `account/wishlist`) |
| `Skeleton.jsx` | — | 5 files |
| `Badge.jsx` | — | **0 files** |
| `PasswordInput.jsx` | — | 4 auth pages |
| `AnimatedText.jsx` | 67 | 2 files |
| `WhatsAppWidget.jsx` | — | `ClientLayout` (uses `BRAND.phoneE164`) |

→ **Most forms and buttons are still bespoke CSS-module markup.** Migrating a page
to `Button`/`Input` is the highest-leverage consistency win available.

### `seo/` — JSON-LD, all server-rendered into initial HTML
`OrganizationSchema` · `LocalBusinessSchema` (58) · `WebSiteSchema` (mounted in
`layout.js`) · `ProductSchema` (69 — **omits `aggregateRating` entirely when count
is 0**) · `BreadcrumbSchema`.

### `hooks/useFocusTrap.js` (49)
`useFocusTrap(isActive)` → ref. Tab/Shift-Tab cycling, focuses first element on
open, **restores previous focus on close**. Used by `CartDrawer`, `Navbar` side
menu, `SizeGuideModal`.

---

## 12. Admin app — `beyond-stich-admin/`

Runs on **:3001**. Tailwind 4 installed; pages mostly use CSS modules + inline styles.

| File | Lines | Notes |
|---|---|---|
| `src/middleware.js` | 50 | Edge guard on everything except `/login`, `/api/auth/*`, `/_next`. **`jwtVerify` via `jose`** (jsonwebtoken doesn't run on Edge). Requires `payload.role === 'admin'`; clears the cookie on failure. **Throws at startup if `JWT_SECRET` is unset — deliberate** |
| `src/lib/auth.js` | 58 | `signToken` (7d) · `verifyToken` · `hashPassword` (bcrypt **cost 12**) · `comparePassword` · **`getAdminFromRequest`** (re-checks `role === 'admin'` — middleware alone is not enough for API routes). `TOKEN_NAME = 'bs_admin_token'` |
| `src/app/AdminShell.jsx` | 90 | `ADMIN_NAV` L7–18 (10 items, incl. HOME PAGE + BANNERS). Split from `layout.js` so `layout.js` stays a Server Component and can export `viewport` |
| `src/app/layout.js` + `layout.module.css` | — | Server shell |
| `src/instrumentation.js` | — | Startup hook |

**Pages:** `page.js` (136, overview) · `products/page.js` (474) · `orders/page.js`
(521) · `inventory/page.js` (235) · `coupons/page.js` (286) · `reviews/page.js` (321)
· `analytics/page.js` (299) · `users/page.js` (281) · `login/page.js` (216) · **`homepage/page.js` (manage home page sections)** · **`banners/page.js` (manage hero slides, Cloudinary upload per breakpoint)**.

**API** (`src/app/api/`): every route calls `getAdminFromRequest` first.
`dashboard` (124) · `analytics` (110) · `products` + `[id]` (93/80) · `orders` +
`[id]` (55/111) · `coupons` + `[id]` · `reviews/[id]` · `users` + `[id]` (64/60)
· `auth/login` (84, rate-limited) · `auth/logout` · `home-sections` + `[id]` · `banners` + `[id]`
· **`upload`** — Cloudinary, shape chosen by the `purpose` form field:
`product` (default) → `beyond-stich/products`, 800×1000 `crop:fill`;
`banner-desktop` → `beyond-stich/banners`, w2400 **`crop:limit`**;
`banner-mobile` → w1200 `crop:limit`. **`limit` never crops** — a wide hero run through the
product preset would lose most of its composition.

`home-sections` and `banners` export `buildPayload()` + `validate()` for the `[id]`
route to reuse. Both `[id]` PUTs special-case a bare `{active}` body (the list-view
toggle) — running the full payload builder over it would blank every other field.
`buildPayload` keeps **only** the selector the chosen `source` uses, so a leftover
`tag` can't resurface later and pull in products nobody picked. `banners`' `validate()`
is **async**: an advertised `code` is checked against the Coupon collection (exists,
active, unexpired) because the announcement bar once promised `WELCOME20`, which was
never in the database.

**Duplicated libs** (keep in sync with the store): `models/{Product,Order,User,Review,Coupon,HomeSection,Banner}.js`,
`mongodb.js`, `constants.js`, `email.js`, `rateLimit.js`, `store.js`, `dummyData.js`.

---

## 13. Config & assets

| File | Notes |
|---|---|
| `next.config.mjs` | `images.formats: ['image/avif','image/webp']`; `remotePatterns`: `images.unsplash.com`, `res.cloudinary.com` (**add any new image host here**). `headers()`: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/interest-cohort off) |
| `jsconfig.json` | `@/*` → `src/*` |
| `eslint.config.mjs` | `eslint-config-next` |
| `scripts/ui-check.js` | Playwright screenshot runner → `.ui-shots/` |

**`public/`** (47 files): `banners/hero/home-{1..4}-{desktop,mobile}.webp` (separate
art direction per breakpoint — real crops, not the same file) · `banners/segments/*.webp`
(13) · `banners/shop/drops-{1..3}-{desktop,mobile}.webp` + 3 PNG badges ·
`banners/offers/first-order-{desktop,mobile}.png` · `banners/og/og-{default,shop}.jpg`
· `logos/{wordmark,watermark}.{png,webp}` + `wordmark@2x/@3x.png` + `icon-192/512.png`.

**Env** (`.env.example`): `MONGODB_URI` · `NEXTAUTH_SECRET` / `NEXTAUTH_URL` ·
`GOOGLE_CLIENT_ID/SECRET` (optional) · `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` /
`NEXT_PUBLIC_RAZORPAY_KEY_ID` / **`RAZORPAY_WEBHOOK_SECRET` (≠ key secret)** ·
`RESEND_API_KEY` / `EMAIL_FROM` / `ADMIN_ALERT_EMAIL` · `CLOUDINARY_*`.
Admin additionally needs **`JWT_SECRET`**.

> Credentials live in `.env.local` only, which is gitignored. A scratch file
> (`env.md`) once held a live Razorpay key in plaintext and was committed; it
> has been scrubbed from history and the `.gitignore` now matches that
> spelling. **Never commit a file holding real keys** — `.env*` does not match
> a name without a leading dot.

---

## 14. Invariants — don't break these

1. **Money is server-authoritative.** Prices, discounts, shipping and totals come
   from `orderIntegrity.js` + `coupon.js`. Never trust a client-sent amount.
2. **`isMock` / mock-mode is decided by server env only** — never by a client field.
3. **Stock is reserved atomically before an order is created**, and released if the
   write fails.
4. **A Razorpay payment must produce exactly one order** — browser (`verify`) and
   webhook race, and `PendingOrder.consumed` + the `razorpayOrderId` lookup decide
   the winner.
5. **Never project `authorEmail`** from reviews into any public response or HTML.
6. **Never emit `aggregateRating` without real approved reviews** (Google manual
   action + Merchant Center suspension risk).
7. **An empty DB result is a valid answer.** Dummy/seed data is only for a thrown
   DB error, never for "no rows".
8. **`skipHydration: true` + `StoreHydration`** is what prevents the cart/wishlist
   hydration flash. Don't "simplify" it away.
9. **Any coupon code shown in UI copy** (`banners.js`, `AnnouncementBar`, hero
   slides) **must exist in the DB** with a matching `minOrder`.
10. **`useUIStore` cursor setters stay as no-ops** — ~8 components still call them.
11. **One accent.** Yellow = act. Segment colors are hairlines/labels/tiles only.
12. **`template.js` stays opacity-only** — a transform breaks PDP sticky.
13. **Keep store/admin duplicated models in sync.**
14. **Check `node_modules/next/dist/docs/` before framework-level changes** (Next 16).

---

## 15. Known debt / cleanup targets

| Item | Where |
|---|---|
| `ui/Input` (0 uses) and `ui/Badge` (0 uses); `Button` only 4 files, `Section` only 1 | §11 — most forms/buttons are still bespoke |
| PDP delivery block: hardcoded inline styles, `#22C55E`, `11px`, `+3/+6` days | `ProductDetailClient.jsx` L277–312 |
| Razorpay modal `theme.color: '#C6A14A'` doesn't match `--accent` | `checkout/page.js` ~L358 |
| `rateLimit` is per-instance only | `lib/rateLimit.js` |
| Admin libs duplicated rather than shared | `beyond-stich-admin/src/lib/` |
| `/api/orders` POST still defaults `paymentMethod` to `'mock'` | `orders/route.js` L136 |

---

## 16. Admin-managed home page (sections + banners)

Nothing on the home page hero or its product strips is hard-coded any more —
all of it is database rows the owner edits in the admin panel.

**Store side (read):** `src/lib/homeSections.js`
- `getHomeSections()` → live `HomeSection` rows, each with its products resolved
- `getBanners(placement)` → live `Banner` rows for that spot
- `isLive()` applies the `startsAt`/`endsAt` window; `CARD_FIELDS` is the projection
- manual picks are re-sorted back into the order the owner chose (Mongo returns
  `$in` results in storage order, not argument order)
- **both return `[]` on error and sections with 0 products are dropped** — a bad
  row or a dead database must never take the home page down

**Rendered by:** `components/home/ProductSection.jsx` (+ `.module.css`) — a server
component that reuses `Section`, `Button` and `ProductCard`; `grid` or `carousel`
per the row's `layout`.

**Fallbacks:** with no banner rows the hero uses the `HERO_SLIDES` constant, so an
empty collection looks exactly like it did before this feature existed. The admin
refuses to switch off the last live slide for a placement, because that silently
flips the storefront back to the built-ins and reads as a bug.

**Admin side (write):** `/homepage` and `/banners` — see §12.

**Both placements are live:** `home-hero` → `HeroSection`, `shop-hero` →
`ShopBanner`. Each falls back to its constant in `src/lib/banners.js`.

**Seeding:** `scripts/seed-banners.mjs` (`--dry` to preview) writes the original
`HERO_SLIDES` + `SHOP_BANNERS` into the collection verbatim, so the switch is
invisible to a customer. `$setOnInsert` only — a re-run never overwrites an
edited slide. It refuses to write if an image path is missing under `public/` or
an advertised coupon does not exist / is off / has expired. **Already run:
4 `home-hero` + 3 `shop-hero` rows.**

Banner art seeded from constants stays as local `/banners/**.webp`; anything
uploaded from the admin goes to Cloudinary (`beyond-stich/banners`).

`SHOP_HERO_SLIDES` in `lib/banners.js` is **dead code** — imported nowhere since
the separate shop hero band was removed.

**To add a strip to the home page:** tag the products, then Admin → HOME PAGE →
ADD SECTION, source "By tag". No deploy needed; `/` revalidates every 300s.

---

## 17. Change recipes

| Task | Touch |
|---|---|
| Brand/accent color, spacing, type, radius, z-layer | `app/globals.css` (§2) |
| Add/edit a segment | `lib/constants.js` `SEGMENTS` + add `/public/banners/segments/<id>.webp` to `SEGMENT_IMAGES` |
| Free-shipping threshold or flat rate | `lib/constants.js` `SHIPPING` (used by store, cart drawer, checkout, PDP copy) |
| Welcome-offer tiers | `lib/constants.js` `WELCOME_TIERS` **+ the DB coupons** |
| Homepage section order | `app/page.js` |
| Hero slides / shop banners | `lib/banners.js` + `/public/banners/` |
| Announcement ticker copy | `components/layout/AnnouncementBar.jsx` `MESSAGES` |
| Nav links / mega-menu / mobile menu | `components/layout/Navbar.jsx` |
| Mobile tabs | `components/layout/BottomTabBar.jsx` |
| Footer links / newsletter | `components/layout/Footer.jsx` |
| Product card appearance | `components/product/ProductCard.{jsx,module.css}` |
| PDP layout/content | `ProductDetailClient.jsx` + `product/[slug]/page.module.css` |
| Shop filters/sort | `ShopClient.jsx` (`SORT_OPTIONS`) + `api/products` `SORT_MAP` |
| Checkout steps/fields/validation | `app/checkout/page.js` (`STEPS`, `EMPTY_FORM`, `validate`) **and** `lib/orderIntegrity.js` (server mirror) |
| Coupon rules | `lib/coupon.js` only |
| Order statuses | `lib/constants.js` + `models/Order.js` enum + admin |
| Email templates | `lib/email.js` (store) / `admin/src/lib/email.js` |
| New account page | `app/account/<x>/page.js` + `ACCOUNT_NAV` in `account/layout.js` |
| New info page | `app/<x>/page.js` using `InfoPageLayout` + add to `sitemap.js` |
| New blog post | `lib/blog.js` `BLOG_POSTS` |
| New image host | `next.config.mjs` `remotePatterns` |
| Security headers | `next.config.mjs` `headers()` |
