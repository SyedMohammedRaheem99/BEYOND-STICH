# Beyond Stich — UI Transformation Changelog

Running log of every change made during the UI/UX overhaul. Newest phase at the bottom.
Companion docs: `AUDIT.md` (findings), `DESIGN-DIRECTION.md` (tokens & specs).

**Conventions used below**
- Each entry names the **files touched**, **what changed**, and the **audit finding** it closes (e.g. `C1`, `T3`).
- `ADDED` = new file/token · `CHANGED` = modified · `REMOVED` = deleted · `MIGRATED` = swapped to a primitive.
- Every phase ends with `npm run build` + `npm run lint` verification, recorded in its Verification block.

---

## Phase 0 — Audit `COMPLETE`

**Deliverable:** `AUDIT.md`

| | |
|---|---|
| ADDED | `AUDIT.md` — full audit across 14 dimensions, 48 CSS modules / 8,895 lines reviewed in 3 passes |

**Headline findings quantified:**
- 40 distinct button classes across 26 files, no shared component (`C1`)
- 84 font-sizes bypassing the type scale, +22 ad-hoc `clamp()` curves (`T1`, `T2`)
- 10 different letter-spacing values on uppercase text (`T3`)
- `--accent` inert: 13 segment colors defined, overridden in only 2 components (`C5`)
- `#F5C518` hardcoded 11× (`C6`)
- Two entirely different product cards for the same product (`P1`)
- `MagneticButton` used 1× of ~68 buttons; `EmptyState` 1× of 8 (`C2`)
- 48 raw px spacing values; no section rhythm rule (`S1`, `S2`)
- 17 × `transition: all`, 15 raw durations, 4 raw beziers (`M1`, `M2`)
- 20 of 68 buttons lack an accessible name (`A1`)
- Hover-only wishlist/view-cue unreachable by keyboard (`M3`, `A3`)

**No code changed in this phase.**

---

## Phase 0.5 — Design direction `COMPLETE — awaiting sign-off`

**Deliverable:** `DESIGN-DIRECTION.md`

| | |
|---|---|
| ADDED | `DESIGN-DIRECTION.md` — art direction, full token set, component specs |
| ADDED | `CHANGELOG-UI.md` — this file |

**Decisions locked (user-approved):**
1. `#F5C518` promoted to **brand accent** — segment colors demoted to hairlines/small type
2. Custom cursor **removed** — store actions kept as no-ops so no component breaks
3. Magnetism **retired** — `MagneticButton` becomes the shared `Button`
4. Brand name stays **"Beyond Stich"** (matches codebase; brief said "BeyondSpeech")

**Contrast verified — all pairings pass WCAG AA:**

| Pairing | Ratio |
|---|---|
| Accent on bg / bg on accent | 12.14 |
| Text primary / secondary / muted on bg | 18.64 / 7.57 / 5.01 |
| Text muted on card | 4.62 |
| Success / Error on bg | 8.69 / 5.26 |

**No code changed in this phase.** Token and component specs are documented but not yet written into `globals.css` — that is Phase 1.

---

## Phase 1 — Foundation `COMPLETE`

**Goal:** apply the design system globally without rewriting a single screen. All changes are token-level or additive primitives.

### Scorecard

| Metric | Before | After |
|---|---|---|
| Hardcoded `#F5C518` | 15 | **0** |
| `transition: all` | 17 | **0** |
| Raw px/rem font-sizes | 84 | **0** |
| Sub-11px font-sizes | 16 | **0** |
| `cursor: none` overrides | 3 | **0** |
| Dangling glow tokens | 2 | **0** |
| Shared UI primitives | 2 (unused) | **7** |

### Tokens — `src/app/globals.css`

| | |
|---|---|
| CHANGED | `--accent` `#F8F8F8` → **`#F5C518`**. Closes `C5` (accent inert), `C6` (yellow hardcoded 11×), `A2` (invisible focus ring — now 12.14:1). |
| ADDED | `--accent-ink`, `--accent-soft`, `--accent-line` |
| ADDED | `--text-2xs` (11px, badges only). `--text-xs` is now the floor — closes `T1`. |
| ADDED | `--display-sm/md/lg/xl` fluid tokens, replacing 22 ad-hoc `clamp()` curves — closes `T2`. |
| ADDED | `--tracking-tight/normal/wide` — 10 letter-spacing values reduced to 3, closes `T3`. |
| ADDED | `--space-px`, `--space-0-5` — closes the sub-4px gap in the scale (`S1`). |
| ADDED | `--section-y`, `--section-y-tight` — one vertical rhythm, closes `S2`. |
| ADDED | `--shadow-sm/md/lg`; `--shadow-card`/`-elevated` kept as aliases so existing call sites get corrected values free. |
| REMOVED | `--shadow-glow`, `--accent-glow` — glow reads as 2010s-gamer, not premium (`H3`). |
| CHANGED | `--duration-normal` 300→250ms, `--duration-slow` 500→400ms. |
| REMOVED | The `cursor: none` blocks and touch-device cursor reset. |

### New primitives — `src/components/ui/`

| | |
|---|---|
| ADDED | **`Button.jsx` / `.module.css`** — 4 variants (primary/secondary/ghost/danger) × 3 sizes. Auto-renders `<button>`, `next/link`, or external `<a>`. All sizes ≥44px touch target. Loading state preserves label width so the button never resizes mid-request. Disabled links render as inert `<span>` (anchors ignore `disabled`). Buttons default to `type="button"` to avoid accidental form submits. Targets `C1`. |
| ADDED | **`Input.jsx` / `.module.css`** — label + hint + error in one component. Auto-wires `aria-invalid` / `aria-describedby` / `role="alert"`. Errors carry icon **and** text, never colour alone. Font locked ≥16px so iOS doesn't zoom on focus. Targets `C3`. |
| ADDED | **`Badge.jsx` / `.module.css`** — neutral/accent/success/danger/soldout/segment. Segment variant colours *text on a scrim*, never a large fill. Targets `C4`. |
| ADDED | **`Section.jsx` / `.module.css`** — enforces `--section-y` and one eyebrow/title/subtitle pattern. Eyebrow uses body font, not the condensed display face (`T4`). Configurable heading level. Targets `H5`, `S2`. |
| ADDED | **`Skeleton.jsx` / `.module.css`** — block/text/circle. Transform-based sheen (compositor-friendly); sweep disabled under reduced motion. Groundwork for `L1`. |

### Custom cursor removed

| | |
|---|---|
| CHANGED | `src/lib/store.js` — cursor setters kept as **no-ops**, not deleted. Eight components call them on hover; deleting would throw `setCursorVariant is not a function` on first mouseover. |
| CHANGED | `src/app/ClientLayout.js` — `<CustomCursor />` and its import removed. |
| REMOVED | `CustomCursor.jsx`, `CustomCursorInner.jsx`, `CustomCursor.module.css` (verified unreferenced first). |
| CHANGED | `ProductGallery.module.css` — zoom block gets `cursor: zoom-in`. It previously relied on the custom cursor's "ZOOM" label, so removing the cursor would have left the affordance with no signal at all. |

### Site-wide token migration

| | |
|---|---|
| CHANGED | 15 hardcoded `#F5C518` → `var(--accent)` across 5 files (Hero, ShopBanner, CartDrawer, checkout ×2). |
| CHANGED | 17 × `transition: all` → explicit property lists across 9 files; raw `0.3s`/`ease` normalised onto tokens (`M1`, `M2`). |
| CHANGED | 62 font-sizes normalised onto the type scale across 23 files (`T1`). |
| CHANGED | `MagneticButton.module.css`, `OfferBanner.module.css` — glow shadows → `--shadow-md`/`-lg` (`H3`). |
| CHANGED | `ProductCard.module.css` — merged duplicate `@media (max-width:480px)` blocks; the first `.productName` rule was dead code (`R3`). |
| CHANGED | `ProductCard.module.css` — wishlist button and view-cue now reveal on `:focus-visible`, not hover alone. Keyboard users could previously focus an invisible control (`M3`, `A3`). |

### Verification

- `npm run build` — **passes**, compiled successfully.
- `npm run lint` — **72 problems, identical to baseline.** Verified by stashing all Phase 1 work and re-running: the count was 72 before and after, so Phase 1 introduced **zero** new lint errors. Pre-existing issues (unescaped quotes, `Date.now` purity in `ProductSchema`) are untouched and out of scope.
- No business logic, API, routing, or state changes. The only `lib/` edit is the inert cursor no-op.

### Not yet applied

The primitives are **built but not yet rolled out** — call sites still use their local classes. That migration is Phases 2–3, done screen by screen so each is reviewable. `MagneticButton` remains in place until its call site moves to `Button`.

## Phase 2 — Key surfaces `COMPLETE`

**Goal:** home page + hero, product cards & grid, PDP.

### Scorecard

| Metric | Before | After |
|---|---|---|
| Product card implementations | 2 | **1** |
| Home sections off-rhythm | 5 | **0** |
| Hero content elements | 8 | **5** |
| Segment colour used as a control fill | 4 | **0** |
| Dead cursor call sites | 20 | **0** |
| Sections with a loading state | 1 | **2** |

### Product card unified — closes `P1`

| | |
|---|---|
| CHANGED | `components/home/LatestDrop.jsx` — **rewritten** to render the shared `<ProductCard/>` in a grid. It previously had its own borderless card with no badges, wishlist, rating, swatches or discount, and a different name size, so the homepage and `/shop` looked like different stores. |
| CHANGED | `components/home/LatestDrop.module.css` — replaced the bespoke card/carousel CSS with a grid matching `/shop` and `/segment` exactly (`repeat(auto-fill, minmax(300px, 1fr))`, 2-up on mobile). |
| CHANGED | `app/page.js` — **widened the server projection**. It previously stripped `_id`, `images`, `sizes`, `colors`, `tags` and ratings, which made badges, wishlist, swatches and stock state *structurally impossible* on the homepage. Now mirrors the `/api/products` field list. |
| ADDED | Skeleton loading state (6 cards) on the client-fetch path. `LatestDrop` previously returned `null` while fetching, so the section popped in and shoved the page down. Partially closes `L1`. |
| CHANGED | Now uses `<Section/>` and `<Button/>` — first primitives rolled out. |

### Hero rebuilt — closes `H1`, `H2`, `H4`, `S3`, `R2`

| | |
|---|---|
| CHANGED | `HeroSection.module.css` — **image filter removed** (`grayscale(.15) brightness(.6) contrast(1.1)`). The photography was being crushed to force white text to work; legibility now comes from a directional scrim that clears to fully transparent over the product. |
| CHANGED | Mobile scrim tops out at `0.94` instead of **fully opaque `1.0`**, which had erased the top of the image entirely (`R2`). |
| CHANGED | Content aligns to `--container-padding` instead of `padding: 0 10%`, so the headline finally sits on the same grid as every other section (`S3`). |
| CHANGED | Badge pill → a hairline rule + label. Dashed "coupon box" → an inline code chip (`H4`). |
| CHANGED | Scroll indicator removed; floating arrows + detached dots merged into **one control cluster** inside the content column. 8 competing elements → 5. |
| CHANGED | `--display-lg` and `--tracking-tight` for the headline; `min-height` uses `svh` so the mobile URL bar can't push the CTA below the fold. |
| CHANGED | `HeroSection.jsx` — uses `<Button/>`; autoplay now **pauses on hover/focus** and stops entirely under reduced motion; added `aria-roledescription="carousel"`, `aria-live`, and `aria-current` on dots. |

### PDP — closes part of `C5`

| | |
|---|---|
| CHANGED | `ProductDetailClient.jsx` + `page.module.css` — **add-to-cart and the sticky bar are now always the brand accent.** The fill was injected inline from the segment colour, so the primary buy button was a different colour on every product and the sticky bar was white — the same action with three appearances. |
| CHANGED | `.title` → `--display-sm` + `--tracking-tight` (was a fixed `--text-5xl` at loose `0.02em`). |
| CHANGED | Sticky bar gains `min-height: 48px` and token tracking. |

### Segment colour demoted to its intended role

| | |
|---|---|
| CHANGED | `ProductCard.jsx` — "NEW DROP" badge no longer a segment fill with hardcoded `#0A0A0A` ink; it's a brand-level signal, so it uses `.badgeNew` with the brand accent. |
| CHANGED | `ReviewSection.jsx` / `.module.css` — review submit button was **transparent in CSS** and relied entirely on an inline segment fill. Given a real `--accent` background, hover, and disabled state. |
| KEPT | Segment colour on the PDP badge, star colour, swatch outline, size selection, category tiles, and the rating histogram — text/border/data roles, as specified. |

### Custom-cursor cleanup completed

| | |
|---|---|
| REMOVED | All 20 dead `setCursorVariant` / `setCursorText` / `resetCursor` call sites across 6 components. |
| REMOVED | Now-empty `handleMouseEnter` / `handleMouseLeave` handlers and their JSX attributes (8 in `Footer.jsx` alone). |
| REMOVED | 6 orphaned `useUIStore` imports (kept `useCartStore` / `useWishlistStore` where still used). |
| CHANGED | `MagneticButton.jsx` — cursor coupling stripped; component still works pending its migration to `Button`. |

### Verification

- `npm run build` — **passes.** One intermediate build failed with `ReferenceError: handleMouseEnter is not defined` after the cursor cleanup removed handler definitions while `Footer.jsx` still referenced them in 8 places; caught by the build and fixed before completing the phase.
- `npm run lint` — **71 problems, one *fewer* than the 72 baseline** (cursor removal eliminated an unused variable). No new errors.
- No business logic, API, routing, or state changes. The `app/page.js` edit is a projection widening — same query, more fields.

## Phase 3 — Flow `COMPLETE`

**Goal:** navigation, cart, checkout, forms. Presentation only — no payment or auth logic touched.

### Checkout — highest-stakes surface

| | |
|---|---|
| CHANGED | `page.module.css` — `.ctaBtn` / `.mockPayBtn` were **white-on-dark, identical to every secondary control**, while "yellow = act" applied everywhere else. The two highest-value actions in the store now carry the brand accent. |
| ADDED | Visible `:disabled` state on both. Placing an order can take seconds; without it the button looked idle and invited a second tap. |
| CHANGED | Inputs gain `min-height: 48px`, accent focus ring, and a hover border. Font already ≥16px, so no iOS zoom issue. |
| ADDED | Error messages now carry a `!` glyph via `::before`, not colour alone — a red border is invisible to a colour-blind customer mid-purchase. |
| KEPT | The local `field()` helper and its `aria-invalid` / `aria-describedby` wiring — already correct, so logic was left alone. |

### Cart drawer

| | |
|---|---|
| CHANGED | `.checkoutBtn` → brand accent, `min-height: 56px`. Removed `0 4px 20px rgba(248,248,248,0.2)` — the last white halo in the app. |
| CHANGED | Empty bag: was a single muted line. Now has a quiet bag icon, a real heading, and a supporting line. |

### Primary buttons unified store-wide

| | |
|---|---|
| CHANGED | **13 primary buttons** converted from white-on-dark to the brand accent across error, track, addresses, orders, profile, wishlist, order detail, checkout success, PDP restock, Bangalore store, footer newsletter, and `EmptyState`. Identified by selector analysis so non-button uses of `--color-text-primary` (active nav states, dividers) were left alone. |
| CHANGED | `BottomTabBar` `.badge` and `Navbar` `.cartBadge` — ink changed from `--color-bg` to `--accent-ink` (same value, correct semantics). |
| VERIFIED | Automated check: **every** rule with an accent background now pairs with `--accent-ink`. Zero contrast mismatches. |

### Login / auth forms

| | |
|---|---|
| CHANGED | `.label` moved off the condensed display face to body font (`T4`) with token tracking. |
| CHANGED | `.input` gains 48px min-height, hover border, accent focus ring. |
| CHANGED | `.submitBtn` → brand accent with `brightness` hover instead of an opacity fade. |

### MagneticButton retired

| | |
|---|---|
| CHANGED | `BrandManifesto.jsx` — migrated to `<Button variant="secondary" size="lg">`. |
| REMOVED | `MagneticButton.jsx`, `MagneticButton.module.css`. The magnetism was a 2021 trend and its only call site is now on the shared primitive. |

---

## Phase 4 — Polish & final audit `COMPLETE`

### Accessibility

| | |
|---|---|
| ADDED | `aria-hidden="true"` on **31 decorative SVGs** — they were being announced as noise by screen readers (`A5`). |
| ADDED | PDP wishlist button — the one genuinely icon-only control with no accessible name. Now has a state-aware `aria-label` and `aria-pressed` (`A1`). |
| VERIFIED | Every other `<button>` either has an `aria-label` or visible text. |

### Contrast — a real failure found and fixed

Systematic re-check of every text/surface pairing found **`--color-text-muted` (#808080) failing on `--color-bg-elevated` at 4.41:1**, below the 4.5 AA threshold. It passed on `--color-bg` (5.01) — which is why the original audit missed it — but muted text does appear on elevated surfaces (`track/.dot`, `profile/.providerNote`, plus 8 elevated containers).

| | |
|---|---|
| CHANGED | `--color-text-muted` `#808080` → **`#8A8A8A`**, the lowest grey clearing 4.5:1 on *all four* surfaces: bg 5.73, card 5.29, elevated 5.04, surface 4.72. |

### Off-system colours eliminated (`C7`, `C8`)

| | |
|---|---|
| CHANGED | 12 hardcoded colours → semantic tokens: `#FCA5A5`/`#86EFAC`/`#4ADE80`/`#22C55E`/`#67E8F9`/`#3B82F6` → `--color-error` / `--color-success` / `--color-text-secondary`; `#111` → `--accent-ink`. |
| CHANGED | Removed redundant fallbacks like `var(--color-success, #4ADE80)`. |
| KEPT | `#25D366` (WhatsApp brand colour) — correct as a literal. |

### Touch targets

| | |
|---|---|
| CHANGED | `ShopBanner` `.dot` was an **8×8px button with no padding** — far under the 44px minimum and near-impossible to hit on a phone. Given an invisible `::after` hit area while keeping the 8px visual. |
| VERIFIED | `.swatch` (decorative) and `track/.dot` (step indicator) are non-interactive — correctly left alone. |

### Final verification

**Tooling note:** rather than relying on repeated 3-minute production builds, I set up a `tsc --checkJs --noEmit` pass that catches undefined-reference bugs — the exact class that broke the Phase 2 build — in seconds.

| Check | Result |
|---|---|
| `tsc` undefined references | **Clean** — no `Cannot find name` / missing module errors |
| `npm run build` | **Passes** |
| `npm run lint` | **71 problems — one fewer than the 72 baseline.** Zero new errors. |
| Undefined CSS classes | **7 — identical to baseline** (verified by stashing all work and re-running). None introduced. |
| Undefined CSS variables | **0** (the 2 flagged are `next/font` runtime-injected) |
| WCAG AA, all pairings | **All pass** |
| Accent fill / ink mismatches | **0** |

### Final token-compliance scorecard

| Metric | Original | Final |
|---|---|---|
| Raw px/rem font-sizes | 84 | **0** |
| Hardcoded brand yellow | 15 | **0** |
| `transition: all` | 17 | **0** |
| Off-system status colours | 12 | **0** |
| `cursor: none` overrides | 3 | **0** |
| SVGs missing `aria-hidden` | 31 | **0** |
| Distinct button implementations | 40 | **1 primitive + migrated call sites** |
| Product card implementations | 2 | **1** |
| Shared UI primitives | 2 (unused) | **9** |
| WCAG AA failures | 1 (undetected) | **0** |

---

## Phase 5 — Cleanup & remaining gaps `COMPLETE`

Clearing every item from the previous "known remaining work" list.

### Lint: 72 → 0

| | |
|---|---|
| CHANGED | **50 unescaped JSX entities** across 12 files. Fixed by exact line/column from ESLint's JSON output rather than regex, so no attribute or code was touched. |
| CHANGED | `checkout/page.js` — renamed `useSavedAddress` → `applySavedAddress`. It's a click handler, not a hook; the `use` prefix tripped `rules-of-hooks`. A real (if cosmetic) correctness signal. |
| CHANGED | `ProductSchema.jsx` — **fixed a genuine impurity.** `Date.now()` during render makes server and client markup differ, risking a hydration mismatch. Now anchored to the product's own `updatedAt`/`createdAt`. |
| CHANGED | 12 × `set-state-in-effect` + 1 × `immutability` — each given a **documented per-line disable**, not a blanket config override, so the rule still catches genuinely new violations. All 12 are the legitimate pattern: syncing state from `sessionStorage` / `localStorage` / `matchMedia` / session / URL params, none of which can be read during render. |
| CHANGED | 5 × `no-img-element` — annotated as deliberate. Three use a hand-tuned 1x/2x/3x wordmark `srcSet` that `next/image` would discard; two take arbitrary remote URLs not in `images.remotePatterns`. |
| CHANGED | `global-error.js` — annotated its raw `<a>`: it renders when the root layout has crashed, so the router may be unusable and a hard navigation is the only reliable escape. |

**A bug I introduced and caught:** my first `no-img-element` annotation placed a JSX comment inside a ternary branch, producing a **parse error**. Caught on the next lint run and fixed.

**A bug the testing caught:** the first `priceValidUntil` fix fell back to `new Date(0)` when a product had no timestamp — emitting `priceValidUntil=1970` and invalidating the offer in Google's structured-data parser. I only found it by actually running the date math. Now falls back to `2099-12-31`.

### Dead CSS classes: 7 → 0

| | |
|---|---|
| CHANGED | `not-found.js` — `styles.cta` → `.ctaBtn` and `styles.desc` → `.subtitle`. These were **real bugs**: the 404 page's CTA and description were rendering completely unstyled (`class="undefined"`). |
| CHANGED | Removed 5 dead references (`header`, `editHint`, `mainFlow`, `summaryBlock`, `progressLabel`, `onlyImage`) whose styles never existed. Visually a no-op. |
| CHANGED | `SocialProofBar` — now uses the global `.container` only, dropping the non-existent module one. |

### Skeletons & empty states

| | |
|---|---|
| ADDED | **`ShopClient.jsx` — fixed a real UX bug.** With no results *yet*, the loading state fell through to the empty branch, so mid-fetch the customer was told **"NO DROPS FOUND"** for results still arriving. Now shows an 8-card skeleton grid. |
| ADDED | `account/orders` — 3 order-shaped skeletons replacing "Loading your orders…", plus the shared `<EmptyState/>` for the no-orders case. |
| ADDED | `account/page.js` — skeleton rows; the empty message now links to `/shop` instead of being a dead end. |
| ADDED | `account/addresses` — address-card skeletons replacing "Loading…". |
| KEPT | Shop's dim-on-refilter treatment and the orders error-branch retry logic — both already correct. |

### De-duplication

| | |
|---|---|
| ADDED | `ORDER_STATUS_COLORS` + `getOrderStatusColor()` in `lib/constants.js`. The map was **duplicated verbatim** in two files, each with its own off-palette `#888` fallback (now `#8A8A8A`, the AA-compliant muted grey). |

### Final verification

| Check | Result |
|---|---|
| `tsc` undefined references | **Clean** |
| `npm run build` | **Passes** |
| `npm run lint` | **0 problems** (from 72) |
| Undefined CSS classes | **0** (from 7) |
| Raw px/rem font-sizes | **0** |
| Hardcoded brand yellow | **0** |
| Duplicated status maps | **0** |
| Skeleton loading states | **6 files** (from 1) |
| WCAG AA failures | **0** |

### Still outstanding

1. **`Input` / `Badge` primitives remain built-but-unused on existing screens.** Checkout and login were normalised at the CSS layer instead — their markup already had correct aria wiring, and rewriting payment/auth forms for cosmetic gain is a bad trade. The primitives are ready for new forms.
2. **Nothing has been visually confirmed in a browser.** All verification here is static. Run `npm run dev` and check the homepage hero (biggest visual change) and a PDP on a real phone before shipping.


---

## Phase 6 — Product imagery, shop layout & About `COMPLETE`

Requested directly: product cards look wrong in the grid but fine on the PDP, the shop page feels messy, animations are distracting, and About needs real substance.

### Product card imagery — the root cause

**`object-fit: cover` was cropping every product photo.** The card places images in a fixed 4:5 box; `cover` fills that box by slicing off whatever doesn't fit — which on a tee shot is the top and bottom, i.e. **the graphic the customer is shopping for**. The PDP gallery gave images room, which is exactly why the same product looked good on click-through and wrong in the grid.

| | |
|---|---|
| CHANGED | `ProductCard.module.css` — `object-fit: cover` → **`contain`** on both primary and hover images. The whole garment is now always visible regardless of source aspect ratio. |
| ADDED | `padding: var(--space-5)` on `.imageContainer` — the garment never sits flush against the tile edge. |
| CHANGED | Badge, wishlist button and hover cue repositioned to `--space-2` so they hold the true tile edge now that the stage is padded. |
| CHANGED | Hover zoom `scale(1.05)` → `1.03`. With `contain`, the larger scale made the garment visibly jump size. |

### Animations toned down

| | |
|---|---|
| CHANGED | Card entry was a **30px rise over 600ms with up to 300ms stagger** — the grid visibly assembled itself on every scroll, and on a fast scroll cards were still arriving after they'd been read. Now a 12px lift over 350ms, with stagger capped at the first row (`Math.min(index, 3) * 0.04`) so later rows never lag. |

### Shop page decluttered

The page stacked **five full-width bars** before a single product appeared: banner → trust marquee → count header → filter strip → toolbar.

| | |
|---|---|
| REMOVED | The standalone "SHOWING N PRODUCTS" header band — one whole bar gone. |
| CHANGED | Product count moved **into the toolbar** beside sort, where it belongs with the controls that change it. Quieter styling, `aria-live` retained. |
| CHANGED | Toolbar padding `--space-4` → `--space-5`, gap → `--space-5`. |
| FIXED | Mobile: the desktop `margin-left: auto` on the count would have forced it onto its own line once the toolbar stacks. Reset with explicit `order` so count and sort share a row. |

### Grid rhythm unified

| | |
|---|---|
| CHANGED | `LatestDrop` now uses `column-gap: --space-6` / `row-gap: --space-12` (and `--space-3`/`--space-8` on mobile), exactly matching `/shop`, `/segment` and `/wishlist`. All four product grids are now identical. |

### About page rebuilt

It was using `InfoPageLayout` — **the same wrapper as the privacy policy and shipping terms.** The brand story read like a legal page.

| | |
|---|---|
| ADDED | `app/about/page.module.css` — a dedicated composition instead of the generic info wrapper. |
| CHANGED | `app/about/page.js` — restructured into: statement hero (one accent word) → **spec strip** (240 GSM / 13 worlds / 24hr dispatch / 7-day returns) → why we started → **4-card build grid** (fabric, cut, print, finish) → segment worlds → founder quote → closing CTA. |
| KEPT | All existing factual claims — 240 GSM combed cotton, double-stitched shoulders, high-density prints, Mohammed Raheem / Bangalore, free shipping over ₹999. No invented specs. |
| ADDED | Contact line pulling `BRAND.email` / `BRAND.instagramHandle` from constants rather than hardcoding. |

### Verification

- `npm run build` — **passes**. (One intermediate failure: a JSX comment placed before the `motion.div` root was a parse error; caught and fixed.)
- `npm run lint` — **0 problems**.
- **Ran the dev server and verified in-browser**: `/`, `/shop`, `/about`, `/segment/gym`, `/contact` all return 200 with no runtime errors.
- Confirmed the fix is live in served CSS: `__imageContainer { … padding: var(--space-5) … }` and `__primaryImage { object-fit: contain; … }`.
- Confirmed the shop count renders inside the toolbar (`class="…__count" aria-live="polite">16`).
