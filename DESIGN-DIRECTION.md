# Beyond Stich — Design Direction

**Phase 0.5 deliverable.** Read with `AUDIT.md`. Awaiting sign-off before Phases 1–4.

---

## Art direction

**Confident, quiet, and physical.** Beyond Stich sells heavyweight 240 GSM cotton with bold graphics — the site should feel like the product: substantial, matte, and unafraid of empty space. Near-black ground, generous margins, and one decisive accent doing all the signalling.

The shift is from *loud* to *heavy*. Today the site shouts with glows, gradients, dashed borders, and eight competing hero elements. Premium is the opposite: fewer elements, larger type, more air, and motion you feel rather than notice. **The product photography is the only thing allowed to be colourful** — the interface stays out of its way.

Three rules governing every decision below:
1. **One accent.** Yellow means *act* — nothing else is yellow.
2. **Air is the luxury signal.** When in doubt, remove an element and increase spacing.
3. **Photography is never crushed.** Legibility comes from layout, not from dimming the image.

---

## Decisions locked (per your approval)

| Decision | Resolution |
|---|---|
| `#F5C518` | **Brand accent.** Promoted to `--accent`. Segment colors demoted to hairlines/small type only. |
| Custom cursor | **Removed.** Store actions kept as no-ops so no component breaks. |
| Magnetism | **Retired.** `MagneticButton` becomes the shared `Button`. |
| Brand name | **"Beyond Stich"** — matches codebase. No copy changes. |

The accent decision resolves audit findings **C5** (accent inert), **C6** (yellow hardcoded 11×), and **A2** (near-white focus ring) at once — the ring becomes yellow at **12.14:1** contrast.

---

## Design tokens

All verified against WCAG. Full palette measured — **every pairing passes AA**:

| Pairing | Ratio | Grade |
|---|---|---|
| Accent `#F5C518` on bg | 12.14 | AA |
| Bg on accent (button fill) | 12.14 | AA |
| Text primary on bg | 18.64 | AA |
| Text secondary on bg | 7.57 | AA |
| Text muted on bg | 5.01 | AA |
| Text muted on card | 4.62 | AA |
| Success / Error on bg | 8.69 / 5.26 | AA |

### Color

Palette is unchanged in its greys (they were already well-judged) — the change is **wiring**, not repainting.

```
--accent: #F5C518          /* brand accent — the ONLY yellow */
--accent-ink: #0A0A0A      /* text on accent fills */
--accent-soft: rgba(245,197,24,0.12)
--accent-line: rgba(245,197,24,0.32)
```

Segment colors stay defined but change role: **hairlines, small labels, and category tiles only** — never large fills, never CTAs.

Removed: `--shadow-glow`, `--accent-glow` (finding H3). Replaced `#111` and `rgba(17,17,17,…)` with real palette values (C8).

### Typography

One scale, no exceptions. `--text-xs` (0.75rem) is the **floor** — this kills the `9px`/`0.62rem` values in the audit (T1).

```
--text-2xs: 0.6875rem   /* 11px — badges only, the sole sub-xs token */
--text-xs:  0.75rem
--text-sm:  0.875rem
--text-base:1rem
--text-lg:  1.125rem
--text-xl:  1.25rem
--text-2xl: 1.5rem
--text-3xl: 2rem
--text-4xl: 2.5rem
--text-5xl: 3.5rem
--text-6xl: 5rem
```

**Fluid display sizes become tokens**, replacing 22 ad-hoc `clamp()` curves (T2) so headings scale in proportion:

```
--display-sm: clamp(1.75rem, 3vw, 2.25rem)
--display-md: clamp(2.25rem, 5vw, 3.5rem)
--display-lg: clamp(2.75rem, 7vw, 5rem)
--display-xl: clamp(3.5rem, 10vw, 7rem)
```

**Tracking reduced from 10 ad-hoc values to 3** (T3) — the highest-impact typographic fix:

```
--tracking-tight: -0.02em   /* large display */
--tracking-normal: 0
--tracking-wide: 0.14em     /* uppercase labels/eyebrows */
```

**Rule:** Barlow Condensed is for display only — never below `--text-lg` (fixes T4, condensed faces at 11px). Small uppercase labels use Space Grotesk.

### Spacing & rhythm

Scale retained, with two additions closing real gaps (S1):

```
--space-px: 1px
--space-0-5: 0.125rem   /* 2px — the gap:2px used 10× */
--space-1 … --space-32  (unchanged)
```

**Section rhythm becomes a single token**, ending the space-16/20/24 stutter (S2):

```
--section-y: clamp(4rem, 9vw, 7.5rem)
--section-y-tight: clamp(2.5rem, 5vw, 4rem)
```

Hero content adopts `--container-padding` instead of `padding: 0 10%`, so the headline finally aligns to the page grid (S3).

### Radius, elevation, motion

```
--radius-sm: 4px   --radius-md: 8px   --radius-lg: 12px
--radius-xl: 16px  --radius-full: 9999px

/* Elevation — matte and diffuse. No glows. */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.4)
--shadow-md: 0 4px 16px rgba(0,0,0,0.45)
--shadow-lg: 0 12px 40px rgba(0,0,0,0.55)

/* Motion */
--duration-fast: 150ms  --duration-normal: 250ms  --duration-slow: 400ms
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
```

Every `transition: all` (17×) becomes an explicit property list; all 15 raw durations and 4 raw beziers move to tokens (M1, M2).

### Breakpoints

Five inconsistent breakpoints reduced to three, documented as a convention since CSS variables can't be used in media queries (R1):

```
480px   — small phone
768px   — phone / tablet boundary
1024px  — tablet / desktop
```

---

## Component specs

### Button

One component, four variants, replacing **40 classes across 26 files** (C1).

| Variant | Rest | Hover | Active | Disabled |
|---|---|---|---|---|
| `primary` | accent fill, `--accent-ink` text | brightness 1.08, `-1px` | `0`, brightness 0.96 | 38% opacity, no motion |
| `secondary` | transparent, 1px border | border→accent, text→accent | `-0` | 38% opacity |
| `ghost` | transparent, no border | `--color-bg-elevated` | — | 38% opacity |
| `danger` | transparent, error border | error fill | — | 38% opacity |

Sizes `sm` / `md` / `lg`. Every variant: min **44×44px** touch target, visible `:focus-visible` ring (yellow, 12.14:1), `aria-busy` loading state with spinner. Motion capped at 1px translate — the audit's 2–4px lifts read as bouncy.

### Input

Replaces 29 bare `<input>`s (C3). Label, field, hint, and error in one component. Error state uses `--color-error` border **plus** an icon and text — never color alone (a11y). Focus: accent border + 2px ring. 44px min height.

### Badge

Replaces the local badge classes (C4). Variants `neutral` / `accent` / `success` / `danger` / `soldout`. Fixed at `--text-2xs`, `--tracking-wide`, uppercase. Segment badges use segment color as **text on a dark scrim**, never as a fill.

### Card (product)

**One card, everywhere** — `LatestDrop`'s bespoke card is retired for `ProductCard` (P1). Spec: 4/5 image (already consistent), hairline border, `--color-bg-card` fill, hover = crossfade to second image + `-2px` lift + border lightening. Wishlist and view-cue become **focus-visible as well as hover-visible** (M3, A3). The `cursor: none` override is removed (P3).

### Nav

Height unchanged (70/60px). Solid ground on scroll instead of blur (PF1). Active link marked by a 2px accent underline, not color alone. All icon buttons get `aria-label` — closing the 20 unnamed buttons (A1).

### Section

New layout primitive enforcing `--section-y` rhythm and one eyebrow/heading pattern, replacing the 3 competing label styles (H5). Uses the already-defined-but-unused `.text-label`.

---

## What this fixes

Phase 1 alone (tokens + primitives) closes: **C1, C2, C3, C4, C5, C6, C7, C8, T1, T2, T3, T4, S1, S2, S3, M1, M2, A2, R1, R3** — the majority of the audit, because they're all consolidation.

Phases 2–4 then handle the surface work: hero simplification (H1, H2, R2), card unification (P1, P2, P3), skeletons (L1), `EmptyState` rollout (L2), and the remaining a11y sweep (A1, A3, A4, A5).

---

## Risk & rollout

Phase 1 is deliberately **additive**: new tokens land alongside the old, primitives are built, and screens migrate incrementally. No screen is rewritten blind. Nothing touches business logic, API calls, routing, or state — the only `lib/` change is neutering cursor actions to no-ops, which is inert by design.

Verification after each phase: `npm run build` and `npm run lint` must pass clean.
