# BeyondSpeech / Beyond Stich — UI/UX Audit

**Scope:** `beyond-stich-store/` (Next 16, React 19, CSS Modules, framer-motion, zustand)
**Date:** 2026-09-05
**Method:** Three passes over 48 CSS modules (8,895 lines) and all app/component source.

---

## Executive summary

The verdict "generic and inconsistent" is accurate, but the *cause* is not what it looks like. This is **not** a codebase without a design system — `globals.css` has a genuinely well-considered token layer (type scale, spacing scale, radii, easings, a 15-value z-index scale with rationale comments, WCAG-corrected muted text). Someone did real work here.

The problem is that **the token layer is declared but not enforced**. Almost every component re-implements what the tokens already provide, slightly differently each time. The result is a site with one design system on paper and roughly twenty-six in practice.

Four numbers define the whole problem:

| Signal | Count | Meaning |
|---|---|---|
| Distinct button classes | **40 across 26 files** | No button component. Every surface invents one. |
| Font-sizes bypassing the type scale | **84** (+22 ad-hoc `clamp()`) | The type scale is decorative. |
| `MagneticButton` adoption | **1 of ~68 buttons** | Primitive exists, was never rolled out. |
| `EmptyState` adoption | **1 of 8 empty states** | Same story. |

**This is good news.** The foundation is sound, so the fix is consolidation, not reconstruction — far lower-risk than a rewrite. Fixing the shared primitives lifts every screen simultaneously.

**Severity legend:** `Critical` = actively reads cheap · `High` = clearly sub-premium · `Medium` = noticeable to a designer · `Polish` = final 5%.

---

## 1. Components — no primitive layer `CRITICAL`

The single largest driver of the cheap feel.

**C1. Forty button implementations, no `Button` component.** `Critical`
Every screen hand-rolls its CTA. Padding, letter-spacing, radius, and hover behaviour all differ:

| File | Padding | Font-size | Letter-spacing | Hover |
|---|---|---|---|---|
| `HeroSection.module.css:.cta` | `14px 32px` | `0.8rem` | `0.2em` | yellow bg + lift + glow |
| `OfferBanner.module.css:.cta` | `space-3 space-6` | `0.7rem` | `0.18em` | fill accent + 1px lift |
| `ShopBanner.module.css:.cta` | `12px 28px` | `0.75rem` | `0.18em` | brightness + 2px lift |
| `MagneticButton.module.css` | (own scale) | — | — | magnetic spring |

Four buttons, four visual languages, all above the fold on one page. Files: `app/account/addresses` (7 button classes), `app/product/[slug]` (6), plus `checkout`, `login`, `track`, `error`, `stores/bangalore`, `CartDrawer`, `ReviewSection`, `Navbar`, `Footer`, `WhatsAppWidget`, `SizeGuideModal`, `ProductCard`.

**C2. Primitives exist but were never adopted.** `Critical`
`MagneticButton` is used only in `BrandManifesto.jsx`. `EmptyState` only in `account/wishlist`. Meanwhile 8 other files hand-roll empty states (`shop`, `segment`, `checkout`, `CartDrawer`, `account/*`). The intent was right; the rollout never happened.

**C3. 29 raw `<input>` elements, no `Input` component.** `High`
Only `PasswordInput` is shared. Base styling lives in a `globals.css` element selector, so every form re-specifies labels, error text, and focus treatment locally. Checkout — the highest-stakes surface — is entirely bespoke.

**C4. No `Badge` / `Chip` primitive.** `High`
`ProductCard` badges (`SOLD OUT` / `LOW STOCK` / `NEW DROP`) are local classes with `font-size: 10px` hardcoded; PDP `.fitType` re-invents a pill with `padding: 2px 8px`. Same object, different code.

---

## 2. Typography `CRITICAL`

**T1. The type scale is bypassed 84 times.** `Critical`
`--text-xs … --text-hero` is defined, then ignored. Raw values found: `10px` (×14), `16px` (×9), `11px` (×8), `9px` (×2), plus `1.1rem`, `0.95rem`, `0.7rem`, `0.62rem`, `0.65rem`, `0.85rem`…

`0.62rem` (≈9.9px) and `9px` are below the ~11px floor premium brands respect. `--text-xs` exists at `0.75rem` and should be the floor.

**T2. Twenty-two ad-hoc `clamp()` scales.** `High`
Each fluid heading invents its own curve — `clamp(1.3rem, 2.5vw, 1.6rem)` (OfferBanner), `clamp(2.5rem, 6vw, 5.5rem)` (Hero), `clamp(1.4rem, 3vw, 2.2rem)` (ShopBanner). Headings therefore scale at different rates across breakpoints; nothing stays in proportion.

**T3. Letter-spacing is unsystematic.** `High`
Observed on uppercase display text: `0.02em`, `0.04em`, `0.05em`, `0.1em`, `0.12em`, `0.15em`, `0.18em`, `0.2em`, `0.25em`, `0.3em`. Ten values, no rule. This is exactly the detail that separates Aesop-tier from generic — tracking should be a function of size and case, ideally 3 values.

**T4. Display font used at body sizes.** `Medium`
Barlow Condensed (a condensed display face) is used at `--text-sm`/`--text-xs` for `.title` in TrustBar, `.viewAll`, breadcrumbs, `.segmentName`. Condensed faces lose legibility badly at small sizes.

---

## 3. Color `HIGH`

**C5. The accent system is declared but not wired.** `Critical`
13 segment accents (`--accent-gym`, `--accent-coffee`…) are defined, and `--accent` defaults to `#F8F8F8` (near-white). But `--accent` is only ever overridden in **two** components (`OfferBanner.jsx:49`, `ShopBanner.jsx:82,114`). Everywhere else — including the entire PDP and segment pages, where segment identity matters most — the "accent" resolves to white. The brand's most distinctive idea is effectively switched off.

**C6. `#F5C518` hardcoded 11 times.** `High`
The gym yellow is pasted as a literal into `HeroSection` (badge bg, badge border, badge text, code, CTA hover, dot progress) and `ShopBanner` (`.dotActive`, `.cta` fallback). It functions as the de-facto brand accent while being defined as *one segment's* color. Either it is the brand accent (promote to `--brand-accent`) or it is not (remove). Currently it is both.

**C7. Off-system reds and greens.** `Medium`
`#FCA5A5` (×3), `#86EFAC`, `#4ADE80` (×2), `#67E8F9`, `#3B82F6` appear despite `--color-success` / `--color-error` existing. `globals.css` already documents this exact class of bug for `rgba(220,38,38,…)` — the pattern recurred.

**C8. `#111` vs `#0A0A0A` used interchangeably.** `Medium`
CTA hover text uses `#111` (×3) while `--color-bg` is `#0A0A0A`. Hero/ShopBanner overlays use `rgba(17,17,17,…)` — a background color that does not exist in the palette.

---

## 4. Spacing & rhythm `HIGH`

**S1. 48 raw px spacing values.** `High`
`gap: 2px` (×10), `padding: 4px` (×5), `gap: 6px` (×5), `gap: 8px`, `gap: 10px`, `padding: 12px`, `padding: 120px`, `padding: 60px`. The scale bottoms out at `--space-1` (4px), so sub-4px gaps have no token — a genuine gap in the scale, not just misuse.

**S2. No vertical rhythm rule for sections.** `High`
Home sections use `--space-24` (SegmentGrid, BrandManifesto), `--space-20` (LatestDrop), and `--space-16` (OfferBanner, SocialProofBar) with no logic. Scrolling the homepage, section breathing room visibly stutters. Premium sites hold one section rhythm.

**S3. Container padding vs hero padding diverge.** `Medium`
Hero content uses `padding: 0 10%` (percentage) while every other section uses `--container-padding` (fixed). The hero headline does not align to the grid the rest of the page sits on — visible on wide screens.

---

## 5. Product cards `CRITICAL`

**P1. Two entirely different product cards.** `Critical`
The same product renders two ways depending on section:

| | `ProductCard.jsx` (shop, segment) | `LatestDrop.jsx` inline card (home) |
|---|---|---|
| Container | bordered, `--color-bg-card`, padded, hover-lift | borderless, floating |
| Badges | SOLD OUT / LOW STOCK / NEW DROP | none |
| Wishlist | yes | none |
| Rating | yes | none |
| Swatches | yes | none |
| Discount % | yes | none |
| Name size | `--text-lg` | `--text-2xl` |
| Hover | image crossfade + `VIEW PRODUCT →` cue | scale + gradient wash |

A shopper seeing the home carousel then landing on `/shop` sees a different store. `LatestDrop` should render `ProductCard`.

**P2. Hover cue is invisible to the customer it targets.** `Medium`
`.viewCue` ("VIEW PRODUCT →") is `color: accentColor` — which for most segments resolves against a photo with only a `text-shadow` for contrast. On light imagery it disappears.

**P3. `cursor: none` hardcoded in the card.** `Medium`
`ProductCard.module.css` sets `cursor: none` on `.card` and `.wishlistBtn` unconditionally. `globals.css` carefully gates the custom cursor behind `(pointer: fine) and (prefers-reduced-motion: no-preference)` — the card bypasses that guard, so reduced-motion users lose their cursor over cards.

---

## 6. Home page & banners `HIGH`

**H1. Hero competes with itself.** `High`
Simultaneously on screen: badge pill, 2-line headline, tagline, dashed promo-code box, CTA, left/right arrows, 4 progress dots, and an animated scroll indicator. Eight competing elements. Premium hero = image + one line + one CTA.

**H2. Hero image treatment is heavy-handed.** `High`
`filter: grayscale(0.15) brightness(0.6) contrast(1.1)` *plus* an 85%-opacity gradient overlay. The product photography is being crushed to make white text legible. On mobile the overlay reaches `rgba(17,17,17,1)` — fully opaque — so the top of the image is literally invisible.

**H3. Decorative glow effects read as cheap.** `Medium`
`OfferBanner` layers `.cardGlow` (radial blur), `.accentLine` (gradient sweep), and a `0 0 60px` shadow on one card. `--shadow-glow` similarly. Glow is the fastest way to look 2010s-gamer rather than premium.

**H4. Dashed borders.** `Medium`
`border: 1px dashed` on promo code boxes (Hero, OfferBanner) reads as a coupon-site convention.

**H5. Section labels inconsistent.** `Medium`
`SegmentGrid` label: `font-display`, `0.3em`. `OfferBanner` label: `font-body`, `0.25em`. `LatestDrop` uses a full `--text-5xl` heading with no eyebrow. Three patterns for one role. Note `.text-label` already exists in `globals.css` and is unused.

---

## 7. Motion & micro-interactions `HIGH`

**M1. `transition: all` in 17 places.** `High`
Animates layout properties, causing jank and unintended transitions. Should enumerate properties.

**M2. 15 hardcoded durations + 4 hardcoded cubic-beziers.** `High`
`0.3s ease`, `0.25s ease`, `0.4s cubic-bezier(...)`, `0.6s` alongside the `--duration-*` / `--ease-*` tokens. Hovers across the site therefore feel subtly different in speed.

**M3. Hover-only affordances with no focus equivalent.** `High`
`.wishlistBtn` (opacity 0 → 1 on `.card:hover`) and `.viewCue` never appear on keyboard focus. Keyboard users cannot reach or see the wishlist control. Also an a11y failure.

**M4. Card stagger delay is index-based and long.** `Polish`
`delay: (index % 4) * 0.1` with `duration: 0.6` — the fourth card starts 300ms late. On a fast scroll the grid visibly assembles itself.

---

## 8. Loading, empty & error states `HIGH`

**L1. One skeleton in the entire app.** `Critical`
Only `app/loading.module.css` has shimmer. `LatestDrop` client-fetches with **zero** loading state and `if (drops.length === 0) return null` — the section pops in. Shop filtering, cart, and account pages have no skeletons.

**L2. Eight bespoke empty states.** `High`
Per C2 — `shop`, `segment`, `checkout`, `CartDrawer`, `account/{orders,addresses,page}` each hand-roll one while `EmptyState` sits unused.

---

## 9. Accessibility `HIGH`

**A1. 20 of 68 buttons lack an accessible name.** `High`
68 `<button>` vs 48 `aria-label`. Icon-only buttons without labels are unusable on a screen reader.

**A2. Focus states rely solely on the global ring.** `High`
`:focus-visible` is defined globally (good), but its color is `var(--accent)` — which resolves to near-white on a near-black background almost everywhere (see C5). Low-contrast focus indicator, and no component defines its own.

**A3. Hover-gated controls unreachable by keyboard.** `High`
Per M3.

**A4. Contrast risk on muted text over imagery.** `Medium`
`--color-text-muted` (`#808080`) is AA on `#0A0A0A` — but hero `.tagline` and `.codeNote` (`rgba(255,255,255,0.55)`) sit over photography where the ratio is not guaranteed.

**A5. Decorative SVGs missing `aria-hidden`.** `Polish`
Inconsistent across TrustBar, Hero arrows, ProductCard.

---

## 10. Responsiveness `MEDIUM`

**R1. Breakpoints are inconsistent.** `Medium`
`480`, `600`, `768`, `900`, `1024` all used as "mobile/tablet". `TrustBar` breaks at 900, `SegmentGrid` at 1024/600, `ProductCard` at 768/480. No shared breakpoint tokens (CSS custom properties can't be used in media queries, so these need a documented convention).

**R2. Mobile hero overlay fully occludes the image.** `High`
Per H2 — `rgba(17,17,17,1)` at the gradient base.

**R3. Duplicate `@media (max-width: 480px)` block.** `Polish`
`ProductCard.module.css` declares the same query twice, both setting `.productName` font-size (`--text-base`, then `--text-sm`). The first is dead code.

---

## 11. Performance `MEDIUM`

**PF1. `backdrop-filter` used liberally.** `Medium`
Hero arrows, ShopBanner arrows, card badges, wishlist button. Each creates a compositing layer; several are on scroll-animated elements. Measurable jank on mid-tier Android.

**PF2. Hero renders both crops into the DOM.** `Polish`
Deliberate and documented — `display:none` prevents the fetch. Noted as understood, not a defect.

**PF3. Long `will-change`-free transforms on large elements.** `Polish`
Hero slide transitions animate full-viewport elements with `x: 100%`.

---

## 12. Consistency summary `HIGH`

Same problem solved differently, by count:

| Pattern | Variants |
|---|---|
| Buttons | 40 classes / 26 files |
| Empty states | 9 (1 shared + 8 bespoke) |
| Product cards | 2 |
| Section eyebrow/label | 3 |
| Font-size sources | scale + 84 raw + 22 clamps |
| Letter-spacing values | 10 |
| Transition timings | tokens + 15 raw |
| Breakpoints | 5 |

---

## Recommended phase plan

**Phase 1 — Foundation (highest leverage).**
Extend tokens (tracking scale, section rhythm, sub-4px space, elevation, breakpoint convention); resolve the `#F5C518` brand-accent question (C6) and wire `--accent` properly (C5); build `Button`, `Input`, `Badge`, `Section`, `Skeleton` primitives; replace `transition: all`; add tracking/size normalisation. Expected to lift every screen at once.

**Phase 2 — Key surfaces.**
Retire `LatestDrop`'s bespoke card for `ProductCard` (P1); simplify the hero (H1/H2/R2); rebuild image treatment; PDP hierarchy; grid rhythm.

**Phase 3 — Flow.**
Navbar, cart drawer, checkout, forms, filters — migrate to primitives, fix focus and error states.

**Phase 4 — Polish.**
Motion consistency, skeletons everywhere (L1), `EmptyState` rollout (L2), a11y sweep (A1–A5), mobile refinement, final consistency pass.

---

## Open questions — need your call before Phase 1

1. **Is `#F5C518` (yellow) the BeyondSpeech brand accent, or just the GYM segment color?** This is the most consequential decision in the audit — it determines whether the site has one accent with segment variation, or is fully segment-driven. My recommendation: promote it to a true brand accent, and reduce segment accents to a *subtle* role (small type, hairlines) rather than large color fields.
2. **Keep the custom cursor?** It's a strong opinion, costs code across every component (`cursor: none` leaking into cards, `useUIStore` cursor calls in ProductCard/LatestDrop/MagneticButton), and is invisible to ~60% mobile traffic. Premium DTC brands mostly don't. My recommendation: remove it.
3. **Keep the magnetic button effect?** It's a 2021 trend. My recommendation: retire the magnetism, keep the component as the shared `Button`.
4. **Brand name — "Beyond Stich" or "BeyondSpeech"?** The codebase says *Beyond Stich* throughout (metadata, schema, domain `beyondstich.com`); your brief says *BeyondSpeech*. I assumed the codebase is correct and changed nothing. Confirm before any copy work.
