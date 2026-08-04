# Beyond Stich — Banner & Imagery System

A production-ready spec for every banner/image on the storefront: **what's needed, exact
sizes, AI generation prompts, and the build plan.** Generate the images, drop them in
`/public/banners/` with the filenames below, and the config-driven components light up.

> **Golden rule:** self-host every image. Hotlinking Unsplash already caused live 404s
> (broken hero/tiles). Never depend on a third-party host for brand imagery again.

---

## 1. Why the current hero + offer banner fail

- **Hero** — a dimmed random *desk* stock photo. It's a backdrop, not a campaign: no
  model, no product, no story. Premium apparel heroes must show **the tee on a person**.
- **Offer banner** — a flat gradient box with a dashed code. Reads as a *coupon widget*,
  not a brand moment. No product, no energy.

Root cause for both: **no art direction, no real imagery.** This system fixes that.

---

## 2. House style (lock this first — cohesion > individual shots)

Every banner must feel like one brand. Fix a **style reference / seed** in your AI tool
and reuse it across all images. Target grade: **dark, moody, filmic, desaturated with a
single accent rim-light.**

**Base prompt (prepend to everything):**
```
editorial streetwear fashion campaign, premium heavyweight oversized cotton t-shirt,
moody cinematic low-key lighting, deep shadows, matte charcoal / black seamless studio
background, desaturated filmic color grade, 35mm film grain, high detail,
shot on 85mm f1.4, shallow depth of field, high-end D2C brand
```

**Negative prompt (always):**
```
text, watermark, logo, deformed hands, extra fingers, busy background,
plastic skin, cartoon, oversaturated, low quality
```

**Consistency rules**
- Same model + same lighting across Hero / Offer / Lookbook.
- Reuse `--sref <url>` (Midjourney style ref) or a fixed `seed`.
- Keep the same color grade; if tools drift, apply one LUT in post.
- Leave deliberate **negative space** where text/CTA will sit.

---

## 3. Banner inventory

| # | Banner | Placement | AI image | Separate mobile crop |
|---|--------|-----------|:--------:|:--------------------:|
| 1 | **Primary Hero** | Home, above the fold | ✅ | ✅ |
| 2 | **Offer / Promo Banner** | Home, mid-page | ✅ | ✅ |
| 3 | **Segment World Tiles** (×13) | Home grid + nav mega-menu | ✅ | — (cover-crops) |
| 4 | **Segment Page Hero** (×13) | `/segment/[name]` | ✅ | ✅ |
| 5 | **Editorial / Lookbook** | Home (brand story) | ✅ | — |
| 6 | **Shop Header** (optional) | `/shop` top | optional | — |
| 7 | **PDP Product Shots** | product pages | ✅ / real | — |
| 8 | **OG / Social Share** | `<meta>` tags | ✅ | — |
| — | Announcement bar | top strip | ❌ text only | — |

---

## 4. Exact sizes, weights & filenames

Generate at the closest **aspect ratio (AR)**, upscale to the export size, then compress.
Export **AVIF (primary) + WebP (fallback)**. Serve the source at max size and let
`next/image` downscale for tiles/PDP; pre-optimize the art-directed hero/offer yourself.

| Banner | AR (desktop / mobile) | Desktop export | Mobile export | Max weight (AVIF) |
|--------|-----------------------|----------------|---------------|-------------------|
| Primary Hero | 16:9 / 4:5 | **2560 × 1440** | **1080 × 1350** | ≤ 280 KB / 150 KB |
| Offer Banner | 21:9 / 1:1 | **2400 × 1030** | **1080 × 1080** | ≤ 220 KB / 130 KB |
| Segment Tile | 4:3 | **1600 × 1200** | (same, cover) | ≤ 120 KB |
| Segment Hero | 16:9 / 3:4 | **2560 × 1440** | **1080 × 1440** | ≤ 280 KB / 160 KB |
| Lookbook panel | 4:5 | **1400 × 1750** | **1080 × 1350** | ≤ 160 KB |
| Shop header | 3:1 | **2400 × 800** | **1080 × 720** | ≤ 180 KB |
| PDP shot | 4:5 | **1600 × 2000** | (same) | ≤ 200 KB |
| OG image | 1.91:1 | **1200 × 630** | — | ≤ 200 KB (JPG ok) |

> Most AI tools cap at ~1.5–2 K px on the long edge. Generate at the AR, then **upscale
> 2×** (tool's upscaler, or Topaz/Real-ESRGAN) to hit the desktop export sizes above.

### Folder structure & naming (must match the config)
```
public/banners/
├── hero/
│   ├── hero-primary-desktop.avif   (2560×1440)
│   ├── hero-primary-desktop.webp
│   ├── hero-primary-mobile.avif    (1080×1350)
│   └── hero-primary-mobile.webp
├── offers/
│   ├── first-order-desktop.webp    (2400×1030)
│   └── first-order-mobile.webp     (1080×1080)
├── segments/                       ← home tiles + mega-menu (1600×1200)
│   ├── gym.webp   coffee.webp   milliniore.webp   music.webp
│   ├── gamer.webp cars.webp     bike.webp         summer.webp
│   ├── floral.webp sports.webp  valentine.webp    typography.webp
│   └── randoms.webp
├── segment-hero/                   ← segment page heroes
│   ├── gym-desktop.webp  gym-mobile.webp   …(×13)
├── lookbook/
│   ├── look-01.webp   look-02.webp
└── og/
    └── og-default.jpg  (1200×630)
```
*Filenames use the exact segment **id** from `src/lib/constants.js`:*
`gym, coffee, milliniore, music, gamer, cars, bike, summer, floral, sports, valentine,
typography, randoms`.

---

## 5. AI prompts per banner

### ① Primary Hero
**Desktop (16:9):**
```
[house style] confident young Indian man, mid-20s, three-quarter stance, hands in
pockets, wearing a plain black oversized heavyweight tee, single hard rim light from
the left, large empty negative space on the RIGHT for headline text, cinematic
--ar 16:9 --style raw
```
**Mobile (4:5):** same subject, **centered**, negative space **top & bottom** for text
`--ar 4:5`

### ② Offer / Promo Banner
```
[house style] two models in oversized streetwear tees leaning on a dark textured
concrete wall, wide cinematic crop, strong directional side light, deliberate negative
space on the LEFT third for the offer text, premium but energetic --ar 21:9 --style raw
```
Mobile: single model, centered, negative space at bottom `--ar 1:1`.

### ③ Segment Tiles + ④ Segment Heroes (template)
```
[house style] {SUBJECT}, {ACCENT} colored rim-light accent, dark moody atmosphere,
medium crop --ar 4:3        (segment hero: --ar 16:9)
```

| id | SUBJECT | Accent |
|----|---------|--------|
| gym | man mid-rep, chalk dust, dumbbells blurred behind | `#F5C518` |
| coffee | hands cradling a coffee cup, steam, dim café | `#C4622D` |
| milliniore | sharp well-dressed man, luxury shadow play, gold light | `#D4AF37` |
| music | silhouette at a mixing desk, neon glow | `#7C3AED` |
| gamer | face lit by monitor glow, RGB ambience | `#00FF94` |
| cars | detail of a matte muscle car + reflection | `#E63946` |
| bike | rider on a motorcycle, motion-blurred streetlights | `#FF6B35` |
| summer | beach at golden hour, backlit figure | `#06B6D4` |
| floral | dark moody botanical, single bold bloom | `#EC4899` |
| sports | athlete mid-motion, stadium haze | `#3B82F6` |
| valentine | moody deep-red bokeh, intimate mood | `#EF4444` |
| typography | extreme close-up of a bold graphic tee, hard shadow | `#F8F8F8` |
| randoms | abstract streetwear collage, subtle glitch | `#94A3B8` |

### ⑤ Lookbook / Editorial
```
[house style] full-body model walking, motion, oversized tee + cargo pants, urban
concrete environment, editorial fashion, vertical composition --ar 4:5
```

### ⑧ OG / Social
```
[house style] hero product on model, centered, "BEYOND STICH" negative space, clean
--ar 1.91:1     (add the wordmark in post, not via AI)
```

---

## 6. Implementation plan

### Step 1 — Self-host
Create `public/banners/` (structure above). All brand imagery lives here. No hotlinks.

### Step 2 — Config-driven banners (`src/lib/banners.js`)
Swap image/copy without touching components:
```js
export const HERO = {
  desktop: '/banners/hero/hero-primary-desktop.webp',
  mobile:  '/banners/hero/hero-primary-mobile.webp',
  eyebrow: 'NEW DROP',
  headline: 'WEAR THE THOUGHT',
  cta: { label: 'SHOP THE DROP', href: '/shop' },
};

export const OFFER = {
  desktop: '/banners/offers/first-order-desktop.webp',
  mobile:  '/banners/offers/first-order-mobile.webp',
  eyebrow: 'FIRST DROP OFFER',
  headline: 'FLAT 10% OFF\nYOUR FIRST ORDER',
  code: 'BEYOND10',            // matches the real checkout coupon
  cta: { label: 'SHOP THE DROP', href: '/shop' },
};
```
Then move `SEGMENT_IMAGES` in `constants.js` to `/banners/segments/<id>.webp`.

### Step 3 — Responsive art direction (do it correctly)
`next/image` cannot swap crops per breakpoint. Two valid patterns:

**A. Hero / Offer (art-directed, pre-optimized) → use `<picture>`.**
Only downloads the matching source; true art direction. We pre-optimized the files, so we
don't need `next/image`'s dynamic resizing here.
```jsx
<picture>
  <source media="(max-width:768px)" type="image/avif" srcSet="/banners/hero/hero-primary-mobile.avif" />
  <source media="(max-width:768px)" srcSet="/banners/hero/hero-primary-mobile.webp" />
  <source type="image/avif" srcSet="/banners/hero/hero-primary-desktop.avif" />
  <img src="/banners/hero/hero-primary-desktop.webp" alt="" className={styles.heroImg} loading="eager" fetchPriority="high" />
</picture>
```

**B. Tiles / PDP (one source, many sizes) → use `next/image`.**
```jsx
<Image src={`/banners/segments/${id}.webp`} alt={`${name} world`} fill
       sizes="(max-width:600px) 100vw, (max-width:1024px) 50vw, 33vw"
       style={{ objectFit: 'cover' }} />
```
> Avoid the anti-pattern of two `<Image>` toggled by CSS `display` — the browser may
> download **both**. Use `<picture>` (A) for art-directed banners instead.

### Step 4 — Redesign the two components
- **Hero:** image on one side, headline + CTA over the negative-space side; a *directional*
  gradient scrim for legibility (not the current full black-out). Keep the kinetic type
  but let the photo carry it.
- **Offer banner:** image-led (models on the wall); offer text + code chip + CTA sit in the
  negative-space third. Kill the flat gradient box.

### Step 5 — Optimize & ship
- AVIF first, WebP fallback; hit the weight budgets in §4.
- `priority`/`fetchPriority="high"` on **hero only**; lazy-load everything below the fold.
- Add `og/og-default.jpg` to `metadata.openGraph.images` in `layout.js`.
- Set `<html>`/hero background to the brand black so there's no flash before the image.

### Step 6 — Fallback strategy (so nothing breaks pre-launch)
Until real images exist, the config points at the current working placeholders and the
components render a **solid brand-black + gradient** if a file is missing — the page must
never show a broken image again.

---

## 7. Build checklist

- [ ] Generate hero (desktop + mobile) — house style, negative space
- [ ] Generate offer banner (desktop + mobile)
- [ ] Generate 13 segment tiles (4:3)
- [ ] Generate 13 segment heroes (desktop + mobile)
- [ ] Generate 2–3 lookbook panels
- [ ] Generate OG image + add wordmark in post
- [ ] Upscale 2× → export AVIF + WebP at §4 sizes/weights
- [ ] Drop into `/public/banners/` with exact filenames
- [ ] Wire `src/lib/banners.js` + move `SEGMENT_IMAGES` to local paths
- [ ] Refactor Hero + OfferBanner to config + `<picture>`
- [ ] Verify Lighthouse: LCP < 2.5s, no CLS, all images 200

---

## 8. Quick reference

| Need | Size | AR |
|------|------|----|
| Hero desktop | 2560×1440 | 16:9 |
| Hero mobile | 1080×1350 | 4:5 |
| Offer desktop | 2400×1030 | 21:9 |
| Offer mobile | 1080×1080 | 1:1 |
| Segment tile | 1600×1200 | 4:3 |
| Segment hero | 2560×1440 | 16:9 |
| Lookbook | 1400×1750 | 4:5 |
| OG image | 1200×630 | 1.91:1 |

**Coupon shown in offer = `BEYOND10` (10% off) — already live at checkout.**
