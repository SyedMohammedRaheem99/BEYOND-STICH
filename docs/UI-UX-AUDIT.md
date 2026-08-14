# UI/UX AUDIT — Beyond Stich Storefront

Scope: customer-facing store app (`beyond-stich-store`). Admin panel excluded.
Method: every source file in `src/` read. No inferences — all values taken from code.

---

## 1. REPO MAP

```
beyond-stich-store/
├── src/
│   ├── app/
│   │   ├── layout.js                    # Root layout, fonts, metadata
│   │   ├── template.js                  # Page transition wrapper
│   │   ├── ClientLayout.js              # Client providers, global components
│   │   ├── page.js                      # Homepage
│   │   ├── globals.css                  # Design tokens, base styles
│   │   ├── page.module.css              # Homepage hero styles
│   │   ├── favicon.ico
│   │   ├── shop/
│   │   │   ├── page.js                  # Product listing + filters
│   │   │   └── page.module.css
│   │   ├── product/[slug]/
│   │   │   ├── page.js                  # Product detail
│   │   │   └── page.module.css
│   │   ├── checkout/
│   │   │   ├── page.js                  # Multi-step checkout
│   │   │   ├── page.module.css
│   │   │   └── success/
│   │   │       ├── page.js              # Order confirmation
│   │   │       └── page.module.css
│   │   ├── segment/[name]/
│   │   │   ├── page.js                  # Segment world page
│   │   │   └── page.module.css
│   │   ├── account/wishlist/
│   │   │   ├── page.js                  # Saved items
│   │   │   └── page.module.css
│   │   ├── track/
│   │   │   ├── page.js                  # Order tracking
│   │   │   └── page.module.css
│   │   ├── about/page.js                # Brand story
│   │   ├── contact/page.js              # Contact details
│   │   ├── faq/page.js                  # FAQ
│   │   ├── privacy/page.js              # Privacy policy
│   │   ├── returns/page.js              # Returns & exchanges
│   │   ├── shipping/page.js             # Shipping info
│   │   ├── size-guide/page.js           # Size chart
│   │   ├── terms/page.js                # Terms of service
│   │   └── api/                         # (out of scope except data shape)
│   │       ├── coupon/validate/route.js
│   │       ├── orders/route.js
│   │       ├── orders/track/route.js
│   │       ├── razorpay/order/route.js
│   │       ├── razorpay/verify/route.js
│   │       └── reviews/route.js
│   ├── components/
│   │   ├── home/
│   │   │   ├── HeroSection.jsx + .module.css
│   │   │   ├── TrustBar.jsx + .module.css
│   │   │   ├── SegmentGrid.jsx + .module.css
│   │   │   ├── LatestDrop.jsx + .module.css
│   │   │   ├── OfferBanner.jsx + .module.css
│   │   │   ├── BrandManifesto.jsx + .module.css
│   │   │   └── SocialProofBar.jsx + .module.css
│   │   ├── layout/
│   │   │   ├── AnnouncementBar.jsx + .module.css
│   │   │   ├── Navbar.jsx + .module.css
│   │   │   ├── CartDrawer.jsx + .module.css
│   │   │   ├── Footer.jsx + .module.css
│   │   │   ├── CustomCursor.jsx + .module.css
│   │   │   ├── PageLoader.jsx + .module.css
│   │   │   ├── ScrollProgress.jsx + .module.css
│   │   │   ├── ToastManager.jsx + .module.css
│   │   │   └── InfoPageLayout.jsx + .module.css
│   │   ├── product/
│   │   │   ├── ProductCard.jsx + .module.css
│   │   │   ├── ProductGallery.jsx + .module.css
│   │   │   ├── ReviewSection.jsx + .module.css
│   │   │   └── SizeGuideModal.jsx + .module.css
│   │   ├── segment/
│   │   │   └── SegmentHero.jsx + .module.css
│   │   └── ui/
│   │       ├── AnimatedText.jsx + .module.css
│   │       ├── MagneticButton.jsx + .module.css
│   │       └── EmptyState.jsx + .module.css
│   └── lib/
│       ├── constants.js          # BRAND, SEGMENTS, SIZES, COLOR_HEX, helpers
│       ├── banners.js            # Hero + Offer banner data
│       ├── dummyData.js          # 16 seed products + review library
│       ├── store.js              # Zustand: cart, wishlist, UI stores
│       ├── mongodb.js            # DB connection
│       ├── data/products.js      # Data-access layer (sort, filter, query)
│       └── models/               # Mongoose schemas (Product, Order, Review, Coupon, User)
```

**Public routes (16):**

| Route | Type | Component |
|---|---|---|
| `/` | Static + client | Homepage |
| `/shop` | Client | Product listing |
| `/product/[slug]` | Dynamic | Product detail |
| `/checkout` | Client | Multi-step checkout |
| `/checkout/success` | Client | Order confirmation |
| `/segment/[name]` | Dynamic | Segment world |
| `/account/wishlist` | Client | Wishlist |
| `/track` | Client | Order tracking |
| `/about` | Static | Brand story |
| `/contact` | Static | Contact info |
| `/faq` | Static | FAQ |
| `/privacy` | Static | Privacy policy |
| `/returns` | Static | Returns & exchanges |
| `/shipping` | Static | Shipping info |
| `/size-guide` | Static | Size chart |
| `/terms` | Static | Terms of service |

---

## 2. STACK & CONVENTIONS

| Concern | Value |
|---|---|
| Framework | Next.js 16.2.11 (App Router) |
| React | 19.2.4 |
| TypeScript | Not used. JavaScript only. No `tsconfig.json`. `jsconfig.json` with `@/*` alias to `./src/*` |
| Styling | CSS Modules (`.module.css` per component) + one `globals.css` for tokens/base. No Tailwind config file — utility classes defined manually in globals. |
| Animation | Framer Motion 12.42.2 (primary), GSAP 3.15.0 (installed but not imported in any read file) |
| State | Zustand 5.0.14 with `persist` middleware (localStorage). 3 stores: cart, wishlist, UI |
| Auth | next-auth 5.0.0-beta.32 (installed, not integrated in any storefront route) |
| Payment | razorpay 2.9.8 (installed, API routes mocked) |
| DB | mongoose 9.8.0 |
| Icons | Inline SVG throughout. No icon library |
| Font loading | `next/font/google` — Barlow Condensed (display, weights 400-900) + Space Grotesk (body, weights 300-700). `display: 'swap'` |
| Images | `next/image` with `remotePatterns` for `images.unsplash.com` and `res.cloudinary.com`. Formats: `['image/avif', 'image/webp']` |

**Naming conventions observed:**

| Element | Convention |
|---|---|
| Page files | `page.js` (lowercase) |
| Components | PascalCase `.jsx` (e.g. `ProductCard.jsx`) |
| CSS Modules | PascalCase matching component (e.g. `ProductCard.module.css`) |
| CSS classes | camelCase (e.g. `.brandTagline`, `.priceRow`) |
| Lib files | camelCase `.js` (e.g. `dummyData.js`) |
| Constants | UPPER_SNAKE_CASE (e.g. `SEGMENTS`, `COLOR_HEX`) |
| Props | camelCase (e.g. `accentColor`, `productSlug`) |
| CSS variables | kebab-case with `--` prefix (e.g. `--color-bg-card`, `--space-6`) |

---

## 3. DESIGN TOKENS — ACTUAL VALUES

### Colors (defined in `globals.css` `:root`)

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#0A0A0A` | Page background, input backgrounds, selection text color |
| `--color-bg-secondary` | `#111111` | Footer bg, BrandManifesto bg, TrustBar bg |
| `--color-bg-card` | `#151515` | Card backgrounds, input backgrounds (cart, review form) |
| `--color-bg-elevated` | `#1A1A1A` | Toast bg, cart elevated surfaces |
| `--color-surface` | `#202020` | Button hover backgrounds (close buttons) |
| `--color-border` | `#2A2A2A` | All borders, dividers, scrollbar thumb |
| `--color-border-hover` | `#3A3A3A` | Input hover borders |
| `--color-text-primary` | `#F8F8F8` | Primary text, headings, logo, button text on dark |
| `--color-text-secondary` | `#A0A0A0` | Secondary text, descriptions, taglines |
| `--color-text-muted` | `#808080` | Labels, captions, eyebrows, muted text |
| `--color-text-accent` | `#FFFFFF` | Hover accent text on product names |
| `--accent` | `#F8F8F8` (default) | Dynamic — set per segment via JS. Used for focus rings, buttons, progress bars |
| `--accent-glow` | `rgba(248, 248, 248, 0.15)` | Glow effects, shadow-glow |

**Segment accent colors (defined in `globals.css` and `constants.js`):**

| Segment | Token | Hex |
|---|---|---|
| GYM | `--accent-gym` | `#F5C518` |
| COFFEE | `--accent-coffee` | `#C4622D` |
| MILLINIORE | `--accent-milliniore` | `#D4AF37` |
| MUSIC | `--accent-music` | `#7C3AED` |
| GAMER | `--accent-gamer` | `#00FF94` |
| CARS | `--accent-cars` | `#E63946` |
| BIKE | `--accent-bike` | `#FF6B35` |
| SUMMER | `--accent-summer` | `#06B6D4` |
| FLORAL | `--accent-floral` | `#EC4899` |
| SPORTS | `--accent-sports` | `#3B82F6` |
| VALENTINE | `--accent-valentine` | `#EF4444` |
| TYPOGRAPHY | `--accent-typography` | `#F8F8F8` |
| RANDOMS | `--accent-randoms` | `#94A3B8` |

**Hardcoded one-off colors in JSX/CSS (not tokens):**

| Color | Where | Purpose |
|---|---|---|
| `#22C55E` | CartDrawer, Footer, ToastManager, ReviewSection, checkout success | Success/positive (savings, free shipping, verified, time tag) |
| `#EF4444` | CartDrawer, ReviewSection, ProductCard, track page | Error/danger (remove hover, error messages, low stock, cancelled orders) |
| `rgba(10, 10, 10, 0.85)` | Navbar search overlay | Overlay background |
| `rgba(0, 0, 0, 0.7)` | Navbar side menu overlay, SizeGuideModal overlay | Overlay background |
| `rgba(10, 10, 10, 0.95)` | ProductGallery zoom overlay | Overlay background |
| `rgba(10, 10, 10, 0.92)` | SegmentGrid tile gradient | Gradient bottom |
| `rgba(17, 17, 17, 0.1/0.8/1)` | HeroSection bg overlay | Gradient stops |
| `rgba(248, 248, 248, 0.6)` | CustomCursor default border | Cursor ring |
| `rgba(248, 248, 248, 0.08)` | CustomCursor hover bg | Cursor fill |
| `rgba(248, 248, 248, 0.95)` | CustomCursor text bg | Cursor text mode |
| `rgba(255, 255, 255, 0.25)` | ProductCard swatch border | Color swatch outline |
| `rgba(255, 255, 255, 0.3)` | ProductGallery dot (mobile) | Pagination dot inactive |
| `rgba(255, 255, 255, 0.04)` | MagneticButton secondary glow | Button hover fill |
| `rgba(255, 255, 255, 0.2)` | MagneticButton primary glow | Button hover gradient |
| `rgba(255, 255, 255, 0.12)` | OfferBanner CTA hover shadow | Button shadow |

**Product color swatches (defined in `constants.js` `COLOR_HEX`):**

| Name | Hex | Fallback |
|---|---|---|
| Black | `#111111` | — |
| White | `#F5F5F5` | — |
| Grey | `#9CA3AF` | — |
| Charcoal | `#374151` | — |
| Mocha | `#8B5E3C` | — |
| Cream | `#F5EAD8` | — |
| Sand | `#D9C7A0` | — |
| Off-White | `#EDE8E0` | — |
| Navy | `#1E3A5F` | — |
| Green | `#16A34A` | — |
| Red | `#E63946` | — |
| (unknown) | `#888888` | Default from `getColorHex()` for unmapped names |

### Font families

| Token | Value | Usage |
|---|---|---|
| `--font-display` | `var(--font-display-src), 'Barlow Condensed', sans-serif` | Headings, labels, buttons, logos, navigation |
| `--font-body` | `var(--font-body-src), 'Space Grotesk', sans-serif` | Body text, paragraphs, taglines, inputs |

### Font sizes

| Token | Value | Px equivalent |
|---|---|---|
| `--text-xs` | `0.75rem` | 12px |
| `--text-sm` | `0.875rem` | 14px |
| `--text-base` | `1rem` | 16px |
| `--text-lg` | `1.125rem` | 18px |
| `--text-xl` | `1.25rem` | 20px |
| `--text-2xl` | `1.5rem` | 24px |
| `--text-3xl` | `2rem` | 32px |
| `--text-4xl` | `2.5rem` | 40px |
| `--text-5xl` | `3.5rem` | 56px |
| `--text-6xl` | `5rem` | 80px |
| `--text-hero` | `clamp(4rem, 12vw, 10rem)` | 64px–160px |

**Hardcoded font sizes (not using tokens):**

| Value | Where |
|---|---|
| `clamp(4rem, 14vw, 12rem)` | HeroSection `.letter` |
| `clamp(2.5rem, 8vw, 6rem)` | InfoPageLayout `.title` |
| `clamp(2.5rem, 8vw, 4rem)` | PageLoader `.logoBeyond` |
| `clamp(2.5rem, 6vw, 4.5rem)` | BrandManifesto `.title` |
| `clamp(4rem, 15vw, 12rem)` | SegmentHero `.title` |
| `clamp(1rem, 3vw, 1.5rem)` | SegmentHero `.tagline` |
| `clamp(1.5rem, 4vw, 2.5rem)` | Segment page editorial quote |
| `1.4rem` | Navbar `.logoText`, Footer `.brandName`/`.brandAccent` |
| `1.1rem` | Navbar mobile `.logoText` |
| `11px` | Navbar mega tag, ToastManager `.toastBold` |
| `13px` | ToastManager `.toastProduct` |
| `10px` | Cart badge, ProductCard `.badge`, OfferBanner `.codeLabel`, AnnouncementBar star, TrustBar mobile `.sub` |
| `9px` | AnnouncementBar star |
| `16px` | ToastManager close button |

### Font weights

| Weight | Where used |
|---|---|
| `300` | Space Grotesk loaded but not explicitly used in CSS |
| `400` | Body text default, SegmentHero tagline |
| `500` | Not explicitly referenced in CSS |
| `600` | Labels, eyebrows, tags, `.text-label`, ToastManager time tag, announcement bar, prices, OfferBanner eyebrow, SizeGuideModal subtitle |
| `700` | Column titles, navigation, mega tags, SegmentGrid label, SocialProofBar label, segment badge, CustomCursor text |
| `800` | Headings, buttons, product names, EmptyState title, review card title, cart total, TrustBar title, LatestDrop product name |
| `900` | Display headings, hero text, logos, segment tile names, manifesto title, offer headline, SocialProofBar value, coupon code, SegmentHero title |

### Letter-spacing values

| Value | Where |
|---|---|
| `-0.02em` | `.text-hero`, SocialProofBar `.value` |
| `-0.01em` | `.text-heading`, BrandManifesto `.title` |
| `0.01em` | OfferBanner `.headline` |
| `0.02em` | InfoPageLayout `.title`, LatestDrop `.name` |
| `0.04em` | SegmentGrid `.tileName`, EmptyState `.title`, SizeGuideModal `.title`, ReviewSection `.title` |
| `0.05em` | HeroSection `.letter`, SocialProofBar `.value`, SegmentHero `.title`, LatestDrop `.title`, ToastManager `.toastProduct`, TrustBar `.title`, size chart row header |
| `0.06em` | Footer newsletter title |
| `0.08em` | Navbar `.logoText`, Footer `.brandName`/`.brandAccent`, review submit button |
| `0.1em` | Navbar links, newsletter button, CustomCursor text, CartDrawer close shadow, ProductCard badge, OfferBanner CTA, OfferBanner code label, EmptyState action, AnnouncementBar, SizeGuideModal table header |
| `0.12em` | `.text-label`, PageLoader logo, SizeGuideModal tips title |
| `0.15em` | Homepage hero CTA, MagneticButton, homepage hero tagline mobile, ProductCard viewCue |
| `0.2em` | HeroSection tagline desktop, SegmentGrid `.label`, BrandManifesto eyebrow, LatestDrop segment badge, OfferBanner code label, SegmentGrid segment name |
| `0.25em` | OfferBanner eyebrow |
| `0.3em` | SegmentGrid `.label`, SegmentHero eyebrow |

### Line-heights

| Value | Where |
|---|---|
| `0.85` | SegmentHero title |
| `0.9` | `.text-hero`, HeroSection `.letter` |
| `0.95` | InfoPageLayout title, OfferBanner headline |
| `1` | SegmentGrid tile name |
| `1.1` | BrandManifesto title |
| `1.5` | SegmentHero tagline, SizeGuideModal tips |
| `1.6` | Body default, BrandManifesto text, InfoPageLayout intro, SizeGuideModal subtitle, EmptyState message |
| `1.8` | InfoPageLayout body paragraphs |

### Spacing scale

| Token | Value | Px |
|---|---|---|
| `--space-1` | `0.25rem` | 4 |
| `--space-2` | `0.5rem` | 8 |
| `--space-3` | `0.75rem` | 12 |
| `--space-4` | `1rem` | 16 |
| `--space-5` | `1.25rem` | 20 |
| `--space-6` | `1.5rem` | 24 |
| `--space-8` | `2rem` | 32 |
| `--space-10` | `2.5rem` | 40 |
| `--space-12` | `3rem` | 48 |
| `--space-16` | `4rem` | 64 |
| `--space-20` | `5rem` | 80 |
| `--space-24` | `6rem` | 96 |

**Hardcoded spacing (not tokens):**

| Value | Where |
|---|---|
| `6px` | Navbar hamburger gap, LatestDrop priceRow margin-top, ReviewSection distribution gap, SegmentHero eyebrow margin |
| `4px` | ProductCard badge padding-block, Cart badge top/right offset |
| `8px` | ProductCard badge padding-inline |
| `2px` | PageLoader progress bar height, ScrollProgress bar height, SegmentGrid accent line height `3px`, SegmentGrid tagline gap, ReviewSection star gap, SizeGuideModal tips title gap, TrustBar text gap |
| `14px` | Navbar mega menu top offset |
| `50px` | Cart drawer focus delay (ms), SizeGuideModal focus delay (ms) |
| `120px` | PageLoader progress bar width |
| `40px` | HeroSection scrollLine height |
| `3px` | HeroSection scrollDot width, SegmentGrid accentLine height |
| `8px` | HeroSection scrollDot height, ProductGallery mobile dot size |
| `1px` | HeroSection scrollLine width, SegmentGrid tileAccentLine, SocialProofBar divider |

### Border-radius

| Token | Value |
|---|---|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-full` | `9999px` |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | `0 4px 24px rgba(0, 0, 0, 0.4)` | Card hover states |
| `--shadow-elevated` | `0 8px 40px rgba(0, 0, 0, 0.6)` | Mega menu |
| `--shadow-glow` | `0 0 30px var(--accent-glow)` | Accent glow effects |

**Hardcoded shadows:**

| Value | Where |
|---|---|
| `0 8px 30px rgba(248, 248, 248, 0.2)` | Homepage hero CTA hover, CartDrawer close button |
| `0 8px 30px rgba(248, 248, 248, 0.25)` | MagneticButton primary hover |
| `0 8px 30px rgba(255, 255, 255, 0.12)` | OfferBanner CTA hover |
| `0 8px 30px var(--accent-glow)` | MagneticButton accent hover |
| `0 10px 40px rgba(0, 0, 0, 0.5)` | ToastManager toast |
| `0 2px 12px rgba(0, 0, 0, 0.6)` | ProductCard viewCue text-shadow |
| `0 0 40px {accent}80` | SegmentHero title text-shadow (dynamic) |
| `inset 0 0 0 1px rgba(0, 0, 0, 0.2)` | ProductCard color swatch |
| `inset 0 0 150px {accent}40` | SegmentHero overlay box-shadow (dynamic) |

### Z-index layers

| Z-index | Element |
|---|---|
| `99999` | CustomCursor, PageLoader |
| `10000` | ProductGallery zoom overlay |
| `2001` | CartDrawer panel |
| `2000` | CartDrawer overlay, ScrollProgress bar |
| `1002` | Navbar side menu |
| `1001` | Navbar side menu overlay, AnnouncementBar |
| `1000` | Navbar |
| `999` | ToastManager, SizeGuideModal modal |
| `998` | SizeGuideModal overlay |
| `900` | PDP sticky mobile bar |
| `100` | Shop filter strip (sticky) |
| `10` | ProductCard badge, ProductGallery mobile dots |

### Breakpoints

| Width | Token | Usage |
|---|---|---|
| `480px` | — | TrustBar smallest text |
| `600px` | — | SegmentGrid single column, ReviewSection form stacking |
| `768px` | `@media (max-width: 768px)` in `:root` | Primary mobile breakpoint: nav height, container padding, hero text, all major layout shifts |
| `900px` | — | TrustBar 2-column, PDP related products grid |
| `1024px` | — | SegmentGrid 2-column, ProductGallery desktop/mobile switch, segment page editorial stacking |

---

## 4. TYPOGRAPHY SYSTEM

| Style | Font | Size | Weight | Tracking | Case | Color | Used in |
|---|---|---|---|---|---|---|---|
| Hero display | `--font-display` | `clamp(4rem, 14vw, 12rem)` | 900 | `0.05em` | uppercase | `--color-text-primary` (BEYOND) / `--color-text-muted` (STICH) | HeroSection title |
| Segment hero | `--font-display` | `clamp(4rem, 15vw, 12rem)` | 900 | `0.05em` | uppercase | `--color-text-primary` | SegmentHero title |
| Section heading | `--font-display` | `--text-5xl` (56px) | 900 | `0.05em` | uppercase | `--color-text-primary` | LatestDrop title |
| Page title (info) | `--font-display` | `clamp(2.5rem, 8vw, 6rem)` | 900 | `0.02em` | uppercase | `--color-text-primary` | InfoPageLayout title, shop page h1 |
| Manifesto title | `--font-display` | `clamp(2.5rem, 6vw, 4.5rem)` | 900 | `-0.01em` | uppercase | `--color-text-primary` | BrandManifesto title |
| Tile name | `--font-display` | `--text-4xl` (40px) | 900 | `0.04em` | — | `--color-text-primary` | SegmentGrid tile name |
| Product card name | `--font-display` | `--text-2xl` (24px) | 800 | `0.02em` | — | `--color-text-primary` | ProductCard, LatestDrop product name |
| H2 in content | `--font-display` | `--text-2xl` (24px) | 800 | `0.04em` | uppercase | `--color-text-primary` | InfoPageLayout h2, ReviewSection title |
| Eyebrow / label | `--font-display` | `--text-xs` (12px) | 700 | `0.2em`–`0.3em` | uppercase | `--color-text-muted` or `--color-text-secondary` | SegmentGrid label, BrandManifesto, InfoPageLayout eyebrow, Footer column titles |
| Button text | `--font-display` | `--text-sm` (14px) | 800 | `0.1em`–`0.15em` | uppercase | `--color-bg` on light bg | MagneticButton, hero CTA, EmptyState action, checkout buttons |
| Nav links | `--font-display` | `--text-sm` (14px) | 700 | `0.1em` | uppercase | `--color-text-secondary` | Navbar desktop links |
| Body text | `--font-body` | `--text-lg` (18px) | 400 | — | — | `--color-text-muted` | BrandManifesto text, InfoPageLayout body |
| Body text (info pages) | `--font-body` | `--text-base` (16px) | 400 | — | — | `--color-text-secondary` | InfoPageLayout paragraphs |
| Tagline / intro | `--font-body` | `--text-lg` (18px) | 400 | `0.2em` | — | `--color-text-muted` | HeroSection tagline, InfoPageLayout intro (italic) |
| Price | `--font-body` | `--text-sm` (14px) | 600 | — | — | `--color-text-primary` | ProductCard, LatestDrop, PDP |
| MRP (struck) | `--font-body` | `--text-xs` (12px) | — | — | — | `--color-text-muted` | ProductCard, LatestDrop |
| Badge | `--font-display` | `10px` | 800 | `0.1em` | uppercase | `--color-text-primary` | ProductCard badges (SOLD OUT, LOW STOCK, NEW DROP) |
| Metric value | `--font-display` | `--text-5xl` (56px) | 900 | `-0.02em` | — | `--color-text-primary` | SocialProofBar |
| Metric label | `--font-display` | `--text-xs` (12px) | 700 | `0.15em` | uppercase | `--color-text-muted` | SocialProofBar |
| Trust title | `--font-display` | `--text-sm` (14px) | 800 | `0.05em` | uppercase | `--color-text-primary` | TrustBar |
| Trust sub | `--font-body` | `--text-xs` (12px) | — | — | — | `--color-text-muted` | TrustBar |
| Announcement | `--font-body` | `--text-xs` (12px) | 600 | `0.1em` | uppercase | `--color-text-primary` on `--color-bg` bg | AnnouncementBar |
| Cart title | `--font-display` | `--text-lg` (18px) | 800 | `0.05em` | uppercase | `--color-text-primary` | CartDrawer |
| Coupon code | `--font-display` | `--text-2xl` (24px) | 900 | `0.1em` | — | `--color-text-primary` | OfferBanner |
| Review star count | `--font-body` | `11px` | — | — | — | `--color-text-muted` | ProductCard `.ratingCount` |

---

## 5. LAYOUT & GRID

### Container

| Property | Value |
|---|---|
| Max-width | `--container-max: 1400px` |
| Padding | `--container-padding: var(--space-6)` (24px), `var(--space-4)` (16px) on mobile |
| Applied via | `.container` class in `globals.css`: `max-width: var(--container-max); margin-inline: auto; padding-inline: var(--container-padding)` |

### Header height

| Property | Value |
|---|---|
| Announcement bar | `--announce-height: 36px` (32px mobile) |
| Navbar | `--nav-height: 70px` (60px mobile) |
| Total header | `--header-height: calc(var(--nav-height) + var(--announce-height))` = 106px desktop, 92px mobile |

### Page-specific layouts

| Page | Structure | Desktop | Mobile |
|---|---|---|---|
| Homepage | Stacked sections, no container on Hero | Full-width hero, contained sections | Same, fluid |
| Shop | Filter strip (sticky) + grid | `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` | 2-column grid, `repeat(2, 1fr)` |
| PDP | 2-column grid | `55% 45%` | Single column |
| Checkout | 2-column | `60% / 5% gap / 35%` | Single column |
| Segment | Hero + editorial grid + product grid | Editorial: `1fr 1fr`. Products: auto-fill | Single column |
| Wishlist | Grid | `repeat(auto-fill, minmax(300px, 1fr))` | 2-column |
| Track | Centered form + result | Max-width centered | Full width |
| Info pages | InfoPageLayout | Body max-width `760px`, intro max-width `640px`, centered | Same |

### Section vertical padding

| Section | Padding |
|---|---|
| Hero sections | `min-height: 100vh` (homepage), `90vh` (segment, `70vh` mobile) |
| SegmentGrid | `var(--space-24) 0` (96px) |
| LatestDrop | `var(--space-20) 0` (80px) |
| BrandManifesto | `var(--space-24) 0` (96px, 64px mobile) |
| SocialProofBar | `var(--space-16) 0` (64px) |
| OfferBanner | `var(--space-16) 0` (64px) |
| TrustBar | `var(--space-8) 0` (32px) |
| Footer newsletter | `var(--space-16) 0` (64px) |
| Footer main | `var(--space-16)` top/bottom (64px) |
| InfoPageLayout hero | `var(--space-20) 0 var(--space-12)` (80px top, 48px bottom) |
| InfoPageLayout body | `var(--space-16)` top (64px), `var(--space-24)` bottom (96px) |
| ReviewSection | `var(--space-20)` top margin, `var(--space-12)` top padding |

### Footer grid

| Breakpoint | Columns |
|---|---|
| Desktop | `1.5fr 1fr 1fr 1fr` (4 columns) |
| Mobile (<=768px) | `1fr 1fr` (brand spans full width) |

### SegmentGrid columns

| Breakpoint | Columns | Tile behavior |
|---|---|---|
| Desktop (>1024px) | `repeat(3, 1fr)` | Large tiles `span 2`, medium `span 1` |
| Tablet (<=1024px) | `repeat(2, 1fr)` | Large tiles `span 2` |
| Mobile (<=600px) | `1fr` | All tiles single column, min-height `160px` |

---

## 6. MOTION & INTERACTION

### Page transitions (`template.js`)

| Property | Initial | Animate | Duration | Easing |
|---|---|---|---|---|
| opacity | 0 | 1 | 0.35s | `[0.16, 1, 0.3, 1]` |

### PageLoader (splash screen)

| Element | Initial | Animate | Duration | Easing | Delay |
|---|---|---|---|---|---|
| Loader exit | — | `opacity: 0` | 0.5s | `easeInOut` | — |
| Logo wrap | `scale: 0.8, opacity: 0` | `scale: 1, opacity: 1` | 0.6s | `[0.16, 1, 0.3, 1]` | — |
| "STICH" text | `opacity: 0, y: 10` | `opacity: 1, y: 0` | 0.4s | — | 0.2s |
| Progress bar | `scaleX: 0` | `scaleX: 1` | 0.9s | `[0.16, 1, 0.3, 1]` | 0.1s |
| Tagline | `opacity: 0` | `opacity: 1` | 0.4s | — | 0.45s |

Loader shows once per session (sessionStorage key `bs_intro_seen`). Total duration: ~1100ms timer. Skipped if `prefers-reduced-motion: reduce`.

### HeroSection animations

| Element | Initial | Animate | Duration | Easing | Delay |
|---|---|---|---|---|---|
| Background image | `scale: 1.12, opacity: 0` | `scale: 1, opacity: 1` | 1.6s | `[0.16, 1, 0.3, 1]` | — |
| BEYOND letters (each) | `y: 120, opacity: 0, rotateX: -90` | `y: 0, opacity: 1, rotateX: 0` | 0.8s | `[0.16, 1, 0.3, 1]` | `0.15 + i*0.04`s |
| STICH letters (each) | `y: 120, opacity: 0, rotateX: -90` | `y: 0, opacity: 1, rotateX: 0` | 0.8s | `[0.16, 1, 0.3, 1]` | `0.35 + i*0.04`s |
| Tagline | `opacity: 0, y: 20` | `opacity: 1, y: 0` | 0.6s | — | 0.7s |
| CTA button | `opacity: 0, y: 20` | `opacity: 1, y: 0` | 0.6s | — | 0.85s |
| Scroll indicator | `opacity: 0` | `opacity: 1` | 0.8s | — | 1s |
| Scroll dot | `y: [0, 20, 0]` | (loops) | 1.5s | `easeInOut` | Infinity repeat |

### Scroll-triggered reveals (useInView)

| Component | Trigger margin | Element | Initial | Animate | Duration | Delay |
|---|---|---|---|---|---|---|
| SegmentGrid | `-100px` | Label | `opacity: 0, y: 20` | `opacity: 1, y: 0` | 0.6s | — |
| SegmentGrid | `-100px` | Each tile | `opacity: 0, y: 60` | `opacity: 1, y: 0` | 0.7s | `i * 0.06`s |
| LatestDrop | `-100px` | Title | `opacity: 0, x: -50` | `opacity: 1, x: 0` | 0.8s | — |
| LatestDrop | `-100px` | VIEW ALL | `opacity: 0, x: 50` | `opacity: 1, x: 0` | 0.8s | — |
| LatestDrop | `-100px` | Each item | `opacity: 0, scale: 0.9` | `opacity: 1, scale: 1` | 0.8s | `i * 0.1`s |
| BrandManifesto | `-20%` | Line | `width: 0` | `width: 40` | 0.8s | `easeOut` |
| SocialProofBar | `-50px` | Each metric | `opacity: 0, y: 20` | `opacity: 1, y: 0` | 0.6s | `i * 0.1`s |
| OfferBanner | `-80px` | Banner | `opacity: 0, y: 30` | `opacity: 1, y: 0` | 0.7s | — |
| TrustBar | `-50px` | Each item | `opacity: 0, y: 16` | `opacity: 1, y: 0` | 0.5s | `i * 0.08`s |
| ProductCard | `-50px` | Card | `opacity: 0, y: 30` | `opacity: 1, y: 0` | 0.6s | `(i%4) * 0.1`s |
| ReviewSection | viewport | Each card | `opacity: 0, y: 20` | `opacity: 1, y: 0` | 0.5s | `min(i,5) * 0.08`s |
| AnimatedHeading | `-100px` | Each word | `y: '110%', rotateX: -80` | `y: '0%', rotateX: 0` | 0.8s | `delay + i*0.08`s |
| AnimatedParagraph | `-50px` | Paragraph | `opacity: 0, y: 30` | `opacity: 1, y: 0` | 0.8s | `delay` |
| RevealOnScroll | `-80px` | Children | `opacity: 0, y: 40` | `opacity: 1, y: 0` | 0.7s | `delay` |

All useInView calls use `once: true`.

### Slide panels

| Panel | Direction | Transition |
|---|---|---|
| CartDrawer | Right (`x: '100%' → 0`) | Spring: damping 30, stiffness 300 |
| Navbar mobile menu | Left (`x: '-100%' → 0`) | Spring: damping 30, stiffness 300 |
| Both overlays | Fade (`opacity: 0 → 1`) | Default |

### Custom cursor (`CustomCursor.jsx`)

| Variant | Width | Height | Background | Border | Mix-blend |
|---|---|---|---|---|---|
| `default` | 16px | 16px | transparent | `1.5px solid rgba(248,248,248,0.6)` | difference |
| `hover` | 60px | 60px | `rgba(248,248,248,0.08)` | `1.5px solid rgba(248,248,248,0.4)` | difference |
| `text` | 100px | 100px | `rgba(248,248,248,0.95)` | none | difference |
| `hidden` | 0 | 0 | — | — | opacity 0 |

Spring: `damping: 25, stiffness: 400, mass: 0.5`. Follows mouse via `useMotionValue`. Renders `cursorText` inside when variant is `text`. Hidden on touch devices (`pointer: coarse`) and `prefers-reduced-motion`. Global `cursor: none` in CSS.

### ScrollProgress bar

Fixed top, height `2px`, `z-index: 2000`, color `var(--accent)`, `transform-origin: 0 50%`. Driven by `useScroll` → `useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 })`.

### AnnouncementBar rotation

4 messages rotating every 3500ms. AnimatePresence mode `wait`:
- Enter: `opacity: 0, y: 6` → `opacity: 1, y: 0` (0.4s, `[0.16, 1, 0.3, 1]`)
- Exit: `opacity: 0, y: -6`

### ToastManager ("just bought" notifications)

Random names/cities. First toast after 5000ms, then random 10–25s intervals. Shows for 4000ms each.
- Enter: `opacity: 0, y: 50, scale: 0.9` → `opacity: 1, y: 0, scale: 1` (spring: stiffness 300, damping 25)
- Exit: `opacity: 0, y: 20, scale: 0.9`

### MagneticButton

Tracks mouse position within button bounds, applies `x * 0.3, y * 0.3` offset. Spring: `stiffness: 350, damping: 15, mass: 0.2`. Resets to `{0, 0}` on leave.

### Hover states

| Element | Effect |
|---|---|
| Homepage hero CTA | `translateY(-3px) scale(1.02)`, box-shadow glow |
| SegmentGrid tile | `translateY(-4px)`, border color to accent, image `scale(1.06)` + grayscale removal, tagline reveals, accent line `scaleX(0→1)`, overlay gradient appears |
| LatestDrop card | Image `scale(1.05)`, overlay fades in, name color to accent |
| ProductCard | Secondary image crossfades (opacity swap), both images `scale(1.05)`, viewCue reveals, wishlist button appears |
| Footer links | `padding-left: var(--space-2)` slide |
| Footer social icons | `translateY(-2px)`, color muted→primary |
| Navbar links | color secondary→primary |
| MagneticButton | Glow opacity 0→1, box-shadow appears |
| OfferBanner CTA | `translateY(-2px)`, box-shadow |
| CartDrawer remove | Color to `#EF4444` |

### SegmentHero parallax

`useScroll` on hero ref, offset `["start start", "end start"]`. Background `y: 0% → 30%`, content `opacity: 1 → 0`. Applied via `useTransform`.

### Pre-animation state (if JS not loaded)

All animated elements start at their `initial` values — mostly `opacity: 0` with various transforms. Content is invisible until JS runs. The `globals.css` has `.page-enter` / `.page-enter-active` CSS-only transition as fallback, but it requires a class toggle that only happens via JS.

---

## 7. COMPONENT INVENTORY

| Component | File | Props | Variants | Used in | Reuse |
|---|---|---|---|---|---|
| AnnouncementBar | `layout/AnnouncementBar.jsx` | none | — | ClientLayout | Single-use |
| Navbar | `layout/Navbar.jsx` | none | — | ClientLayout | Single-use |
| CartDrawer | `layout/CartDrawer.jsx` | none | — | ClientLayout | Single-use |
| Footer | `layout/Footer.jsx` | none | — | ClientLayout | Single-use |
| CustomCursor | `layout/CustomCursor.jsx` | none | 4 cursor variants | ClientLayout | Single-use |
| PageLoader | `layout/PageLoader.jsx` | none | — | ClientLayout | Single-use |
| ScrollProgress | `layout/ScrollProgress.jsx` | none | — | ClientLayout | Single-use |
| ToastManager | `layout/ToastManager.jsx` | none | — | ClientLayout | Single-use |
| InfoPageLayout | `layout/InfoPageLayout.jsx` | `eyebrow, title, intro, children` | — | 8 info pages | Reused (8x) |
| HeroSection | `home/HeroSection.jsx` | none | — | Homepage | Single-use |
| TrustBar | `home/TrustBar.jsx` | none | — | Homepage | Single-use |
| SegmentGrid | `home/SegmentGrid.jsx` | none | — | Homepage | Single-use |
| LatestDrop | `home/LatestDrop.jsx` | none | — | Homepage | Single-use |
| OfferBanner | `home/OfferBanner.jsx` | none | — | Homepage | Single-use |
| BrandManifesto | `home/BrandManifesto.jsx` | none | — | Homepage | Single-use |
| SocialProofBar | `home/SocialProofBar.jsx` | none | — | Homepage | Single-use |
| ProductCard | `product/ProductCard.jsx` | `product, index` | SOLD OUT / LOW STOCK / NEW DROP badges | Shop, Wishlist, Segment, LatestDrop (indirect), CartDrawer cross-sell | Reused (5x) |
| ProductGallery | `product/ProductGallery.jsx` | `images, name` | Desktop / Mobile / Zoom | PDP | Single-use |
| ReviewSection | `product/ReviewSection.jsx` | `productSlug, accentColor, reviews, average, count, distribution, onSubmitted` | Summary + form + cards | PDP | Single-use |
| SizeGuideModal | `product/SizeGuideModal.jsx` | `open, onClose, accentColor` | — | PDP | Single-use |
| SegmentHero | `segment/SegmentHero.jsx` | `segmentData` | — | Segment page | Single-use |
| AnimatedText | `ui/AnimatedText.jsx` | `children, className, delay` | 3 exports: AnimatedHeading, AnimatedParagraph, RevealOnScroll | BrandManifesto | Single-use |
| MagneticButton | `ui/MagneticButton.jsx` | `children, href, onClick, variant, className` | primary / secondary / accent | HeroSection (via banners), BrandManifesto, PDP (related section) | Reused (3x) |
| EmptyState | `ui/EmptyState.jsx` | `icon, title, message, actionLabel, actionHref` | — | Wishlist, Shop (empty filter) | Reused (2x) |

**Near-duplicates:** None identified. Components are distinct.

---

## 8. PAGE-BY-PAGE BREAKDOWN

### `/` — Homepage

**Metadata:** title "Beyond Stich | Wear the thought.", description "Premium oversized graphic tees for men. GYM, COFFEE, MUSIC, GAMER & more."

**Sections (top to bottom):**

1. **HeroSection** — Full-viewport hero (`min-height: 100vh`). Background image from `/banners/hero/hero-primary-desktop.png` (mobile: `/banners/hero/hero-primary-mobile.png`) with CSS filter `grayscale(0.2) brightness(0.7) contrast(1.1)`. Gradient overlay fading to black on right (bottom on mobile). Two ambient light blurs (radial gradients). Text right-aligned on desktop, centered on mobile. "BEYOND" in primary color, "STICH" in muted color, each letter animated in with 3D rotateX. Tagline: "Wear the thought." (italic). CTA: MagneticButton with text from `HERO.cta.label` (default "SHOP THE DROP"), links to `/shop`. Scroll indicator: vertical 1px line with bouncing 3px dot. No ARIA labels on hero.

2. **TrustBar** — 4-column grid (2-col on mobile <=900px). Background `--color-bg-secondary`. Bordered top/bottom. Items with inline SVG icons: "Secure Payments / UPI, Cards, Netbanking", "Cash on Delivery / Available across India", "7-Day Returns / Easy & hassle-free", "240 GSM Premium / Heavyweight cotton". Vertical dividers between items on desktop (via `::after` pseudo-element).

3. **SegmentGrid** — Label "EXPLORE WORLDS" centered. 3-column grid of 12 tiles (RANDOMS filtered out). First 2 tiles `span 2` (large), rest single. Each tile: background segment image (Unsplash, grayscale filter), gradient overlay, segment name (large), tagline (reveals on hover, italic), accent line at bottom (scaleX 0→1 on hover). Links to `/segment/{id}`. Custom cursor shows "ENTER" text on hover.

4. **LatestDrop** — Horizontal scrolling track (hidden scrollbar). Header: "LATEST DROP" (left) + "VIEW ALL →" link to `/shop` (right). 6 product cards (400px width, 280px mobile) showing: image (aspect-ratio 4/5), segment name in accent color, product name, price with optional MRP strikethrough. Links to `/product/{slug}`.

5. **OfferBanner** — Full-width rounded card. Background image from `/banners/offers/first-order-desktop.png`. Left half has gradient overlay with content: eyebrow "FIRST DROP OFFER", headline "FLAT 10% OFF YOUR FIRST ORDER", coupon code box (dashed border, "USE CODE" label, "BEYOND10" code), CTA button to `/shop`. Mobile: full-width with bottom gradient, stacked layout.

6. **BrandManifesto** — Background `--color-bg-secondary`. Centered layout, max-width 800px. Eyebrow "THE MANIFESTO" with animated horizontal lines. Title: "WE DON'T MAKE CLOTHES. WE MAKE STATEMENTS." Two paragraphs of brand copy. CTA: MagneticButton "OUR STORY" linking to `/about`.

7. **SocialProofBar** — 4-column grid (2-col mobile). Four metrics: "240 / GSM HEAVYWEIGHT", "13 / SEGMENT WORLDS" (dynamic count from SEGMENTS.length), "100% / COMBED COTTON", "2 / OVERSIZED FITS". Large display numbers with small labels.

### `/shop` — Product Listing

**Metadata:** title "Shop All Drops | Beyond Stich"

**Sections:**
1. **Header** — Animated h1 "ALL DROPS" + product count text (e.g. "16 drops").
2. **Filter strip** — Sticky horizontal scroll at `z-index: 100`. Pill buttons: "ALL" + each segment name with accent-colored dot. Active pill has accent border + subtle background.
3. **Toolbar** — Search input ("Search drops...") with magnifying glass icon + sort dropdown with 5 options: Newest, Price: Low-High, Price: High-Low, Top Rated, Biggest Discount.
4. **Product grid** — `repeat(auto-fill, minmax(300px, 1fr))`. AnimatePresence with `popLayout`. Each item is a ProductCard.
5. **Empty state** (if no results) — "NO DROPS FOUND" heading, contextual message (mentions search term if present), "RESET FILTERS" button.

**Data source:** `getAllProducts()` from `lib/data/products.js`, filtered client-side by segment + search query. URL param `?q=` seeds search.

### `/product/[slug]` — Product Detail

**Metadata:** Dynamic from product data.

**Sections:**
1. **Breadcrumb** — HOME > ALL DROPS > {SEGMENT} > {PRODUCT NAME}. Each is a link.
2. **2-column layout** (55% / 45%):
   - **Left:** ProductGallery (all images stacked on desktop, horizontal scroll-snap on mobile <=1024px, click to zoom fullscreen).
   - **Right (sticky):**
     - Segment badge (accent color) + fit type label
     - Product name (uppercase, large heading)
     - Price row: ₹{price}, optionally ₹{mrp} strikethrough + "{discount}% OFF" in green
     - Star rating + count (if reviews exist)
     - Color selection: circles (12px, border, accent ring on selected) with color name below
     - Size selection: 5-column grid of buttons. States: default, selected (accent bg), OOS (strikethrough + disabled), low stock ("{n} Left" in red)
     - "ADD TO BAG" button: disabled + "SELECT A SIZE" text until size chosen. Changes to accent-colored "ADDED ✓" for 1600ms after add. Uses segment accent color.
     - Wishlist button: heart outline, fills with accent color when wishlisted
     - Delivery check: PIN code input (6-digit, numeric inputMode) + "CHECK" button. Shows "Delivery in 3–6 business days to {pincode}" on valid or error on invalid.
     - Trust row: 3 inline items with icons — "Secure Checkout", "7-day Returns", "Cash on Delivery"
     - Details: 3 text blocks — THE DROP (description), MATERIAL & BUILD (material, fit type, sizes), SHIPPING (dispatch + delivery info)
3. **ReviewSection** — "CUSTOMER REVIEWS" heading. Summary: average stars + count. Distribution bars (5→1 star). "WRITE A REVIEW" toggle opens form with star picker + name/email/title/body inputs. Review cards in responsive grid.
4. **Related products** — "YOU MAY ALSO LIKE" heading + "MORE {SEGMENT} →" link. 4 ProductCards.
5. **SizeGuideModal** — Triggered by "SIZE GUIDE" link. Table: S/M/L/XL/XXL with Chest/Length/Shoulder in inches. "HOW TO MEASURE" tips.
6. **Sticky mobile bar** — Fixed bottom (z-index 900). Price display + "ADD TO BAG" / "SELECT SIZE" button. Hidden on desktop.

### `/checkout` — Checkout

**Metadata:** title "Checkout | Beyond Stich"

**Empty state:** If cart is empty: "YOUR BAG IS EMPTY" + "BACK TO SHOP" link.

**Sections (2-column: 60% / 35%):**

**Left column — Steps:**
1. **Step 1: ADDRESS** — Form with firstName, lastName (2-col), email, phone (2-col), address (full), city, state, pin (3-col). Validation: required fields, email regex, 10-digit phone, 6-digit pin. Errors shown per-field. "CONTINUE TO SUMMARY" button. Address auto-saved to localStorage key `bs_checkout_address`.
2. **Step 2: SUMMARY** — "DELIVERING TO" card with address recap + EDIT button. "PROCEED TO SECURE PAYMENT — ₹{total}" button.
3. **Step 3: PAYMENT** — Spinner + "INITIALIZING SECURE GATEWAY..." + "Please do not close this window". Calls order creation API, then redirects to success page.

**Right column (sticky):**
- "ORDER TOTAL" heading
- Item list (scrollable, max-height 40vh): image + name + size/qty/price
- Coupon block: input + "APPLY" button, or applied code with "Remove" link. Messages for success/error.
- Totals: Subtotal, "You save" (green), Coupon discount (green, if applied), Shipping (FREE or ₹79), Total (dashed border top)
- "100% Secure Checkout" badge with lock icon

**Step transitions:** AnimatePresence with `x: -20` slide + fade.

### `/checkout/success` — Order Confirmation

**Metadata:** title "Order Confirmed | Beyond Stich"

**Sections:**
1. **Success card** (centered, max-width):
   - Green checkmark icon (inline SVG, color `#22C55E`)
   - "ORDER SECURED." heading
   - "Welcome to the club. Your order has been placed successfully."
   - Order ID box (dashed border): "ORDER ID" label + order number
   - 3-column detail grid (1-col mobile): ITEMS (count), TOTAL PAID (₹amount), EST. DELIVERY (placedAt + 5 days, formatted "DD MMM")
   - Email confirmation note
   - 2 action buttons: "TRACK ORDER" (secondary, links to `/track?order={id}`) + "CONTINUE SHOPPING" (primary, links to `/shop`)

**Data:** Retrieved from sessionStorage key `bs_last_order`. Cart cleared on mount.

### `/segment/[name]` — Segment World

**Metadata:** Dynamic title "{SEGMENT} | Beyond Stich"

**Sections:**
1. **SegmentHero** — 90vh height (70vh mobile). Background: segment Unsplash image with parallax (y: 0→30%). Gradient overlay with segment accent glow (`boxShadow: inset 0 0 150px {accent}40`). Content centered: "WELCOME TO THE WORLD OF" eyebrow, segment name (huge clamp text with accent text-shadow), tagline (italic).
2. **Editorial grid** (2-col, 1-col on <=1024px):
   - Quote: "IN THIS WORLD, BASIC DOESN'T EXIST. WE BUILT THIS COLLECTION TO REFLECT THE MINDSET OF THE {SEGMENT} HUSTLE." 4px vertical accent bar.
   - Stats: "{count} EXCLUSIVE DROPS" + "100% PREMIUM FIT"
3. **Drops section** — "THE {SEGMENT} ARSENAL" heading with horizontal line (accent dot at end). Product grid (auto-fill minmin 300px, 2-col mobile). Empty state: "DROPS INCOMING." if no products.

**CSS variable:** `--world-accent` set from segment data for local accent theming.

### `/account/wishlist` — Wishlist

**Metadata:** title "Wishlist | Beyond Stich"

**Sections:**
1. **Header** — h1 "YOUR ARSENAL" + "{count} DROPS SAVED" count text.
2. **Product grid** — AnimatePresence with ProductCards from wishlist store.
3. **Empty state** — Heart icon (SVG, 48x48), "Your arsenal is empty", "You haven't saved any drops yet. Start exploring the segments.", "Explore all drops" link to `/shop`.

### `/track` — Order Tracking

**Metadata:** title "Track Order | Beyond Stich"

**Sections:**
1. **Hero header** — Eyebrow "ORDER TRACKING", title "TRACK YOUR ORDER", intro text.
2. **Form** — 3-col (1-col mobile): Order number input (placeholder "Order number (e.g. BS-XXXX-XXXX)"), email/phone input (placeholder "Email or phone"), "TRACK ORDER" / "TRACKING..." button.
3. **Error display** — Red text if not found or network error.
4. **Result** (AnimatePresence, if found):
   - Order header: order number + status pill (green or red border based on status)
   - Meta row: placed date, est. delivery, tracking number
   - Timeline: 5 steps (Placed → Confirmed → Shipped → Out for Delivery → Delivered). Completed steps show ✓ with green accent. Active step has glow. Connector lines between steps (green when complete).
   - Cancelled/returned state: message + link to `/contact`
   - Items list: image + name + size/color/qty
   - Total display

**URL param:** `?order=` pre-fills order number.

### `/about` — Brand Story

Uses InfoPageLayout. Eyebrow "THE MANIFESTO", title "We don't make clothes. We make statements." Content: Why we started, The build (240 GSM, double-stitched), Segment worlds, The promise (4 bullets), Who we are (founder Mohammed Raheem, Bangalore).

### `/contact` — Contact

Uses InfoPageLayout. Eyebrow "HELP", title "Contact Us". Email: hello@beyondstich.com, WhatsApp: +91 83102 73670 (wa.me link), Instagram: @beyondstich. Collabs: collab@beyondstich.com. Hours: Mon-Sat 10 AM – 7 PM IST. Based in: Bangalore, India.

### `/faq` — FAQ

Uses InfoPageLayout. Eyebrow "HELP", title "FAQ". Sections: Sizing & Fit (3 Q&As), Orders & Shipping (3 Q&As), Returns (2 Q&As), Payments (2 Q&As). Links to `/returns`.

### `/privacy` — Privacy Policy

Uses InfoPageLayout. Eyebrow "LEGAL", title "Privacy Policy". Sections: What we collect (4 items), How we use (5 items), Third-party sharing (Razorpay, shipping, Cloudinary), Data retention (5 years), Data security, Your rights (access/correction/deletion/opt-out), Children's privacy, Changes. Last updated: August 2026.

### `/returns` — Returns & Exchanges

Uses InfoPageLayout. Eyebrow "HELP", title "Returns & Exchanges". 7-day window, 4-step return process, refund to original method in 5-7 days, exchanges in 2-3 days, damaged items 48-hour window, exceptions (worn/washed/altered), disputes & chargebacks section.

### `/shipping` — Shipping

Uses InfoPageLayout. Eyebrow "HELP", title "Shipping". India-only delivery, free above ₹999 / ₹79 flat, metro 2-4 days / other 4-6 / remote 5-7, partners Delhivery/Shiprocket/India Post, tracking link, non-serviceable areas policy.

### `/size-guide` — Size Guide

Uses InfoPageLayout. Eyebrow "HELP", title "Size Guide". Table: S–XXL with Chest (42–50"), Length (27–31"), Shoulder (21–25"). Measurements in inches. How to measure tips.

### `/terms` — Terms of Service

Uses InfoPageLayout. Eyebrow "LEGAL", title "Terms of Service". 12 sections: Orders & acceptance, Pricing & taxes (GST), Payment (Razorpay, PCI-DSS), Shipping, Returns & refunds, Intellectual property, User conduct, Limitation of liability, Warranties & disclaimers, Dispute resolution (arbitration, Bangalore), Governing law (Bangalore, Karnataka), Changes. Last updated: August 2026.

---

## 9. RESPONSIVE BEHAVIOR

### Primary breakpoint: 768px

| Element | Desktop | Mobile |
|---|---|---|
| Nav height | 70px | 60px |
| Announce height | 36px | 32px |
| Container padding | 24px | 16px |
| Navbar | Inline links + mega menu | Hamburger + side drawer (320px, max 85vw) |
| Hero text | Right-aligned, large clamp | Centered, smaller clamp |
| SegmentGrid label | — | — |
| LatestDrop items | 400px width | 280px width |
| Footer | 4-column grid | 2-column, brand spans full |
| Bottom bar | Flex row | Flex column centered |
| Shop grid | auto-fill minmax(300px) | 2-column |
| PDP layout | 55/45 split | Single column |
| PDP sticky bar | Hidden | Fixed bottom z-900 |
| Checkout | 60/35 grid | Single column |
| Wishlist grid | auto-fill minmax(300px) | 2-column |
| Track form | 3-column | Single column |
| Review header | Side-by-side | Stacked column |
| ProductCard wishlist btn | Opacity 0, shows on hover | Always visible |
| BrandManifesto padding | 96px | 64px |
| TrustBar | 4-column | 2-column |
| ToastManager | Bottom-left, max 380px | Full width, above mobile nav |

### 1024px breakpoint

| Element | Change |
|---|---|
| SegmentGrid | 3-col → 2-col, large tiles span 2 |
| ProductGallery | Desktop stacked → mobile horizontal scroll-snap |
| Segment editorial | 2-col → 1-col |

### 600px breakpoint

| Element | Change |
|---|---|
| SegmentGrid | 2-col → 1-col, min-height 160px |
| Review form | Side-by-side fields → stacked |

### 900px breakpoint

| Element | Change |
|---|---|
| TrustBar | 4-col → 2-col |

### 480px breakpoint

| Element | Change |
|---|---|
| TrustBar text | Title: `--text-xs`, Sub: `10px` |

### No mobile-specific handling

| Element | Note |
|---|---|
| OfferBanner code box | Responsive via flex-direction change, but code box itself doesn't resize |
| SizeGuideModal | Full width with `calc(100% - var(--space-8))` but no breakpoint-specific adjustments |
| Checkout success detail grid | Has responsive 1-col fallback |
| AnnouncementBar | No breakpoint changes (height handled by CSS var) |

### Fixed dimensions that could break

| Element | Fixed value | Risk |
|---|---|---|
| CartDrawer | 420px width (max 90vw mitigates) | Low |
| Side menu | 320px (max 85vw mitigates) | Low |
| LatestDrop items | 280px mobile hardcoded | Could be too wide on very small screens (<300px) |
| Mega menu | `min(680px, 78vw)` | Low |
| Cart item image | 80px × 100px | Low |
| Toast | max-width 380px | Low |

---

## 10. UI STATES

### ProductCard

| State | Implemented | Details |
|---|---|---|
| Default | Yes | Primary image, info, price |
| Hover | Yes | Secondary image crossfade, scale 1.05, viewCue reveals, wishlist btn appears |
| Sold out | Yes | Grayscale image, "SOLD OUT" badge, viewCue hidden |
| Low stock | Yes | "LOW STOCK" badge (if stock 1-6) in accent color |
| New | Yes | "NEW DROP" badge if tags includes 'new' |
| Wishlisted | Yes | Heart fills with accent color, button always visible |
| Loading | NOT IMPLEMENTED | No skeleton or placeholder state |
| Error | NOT IMPLEMENTED | No error state for failed image loads |

### CartDrawer

| State | Implemented | Details |
|---|---|---|
| Empty | Yes | "Your bag is empty" text + "SHOP ALL DROPS →" link |
| With items | Yes | Item list + totals + checkout button |
| Free shipping progress | Yes | Progress bar showing distance to ₹999 threshold |
| Free shipping reached | Yes | "Free Shipping ✓" text in green |
| Savings display | Yes | "You save" row in green (if savings > 0) |
| Cross-sell | Yes | "COMPLETE THE FIT" section with 3 suggested products (from featured, not in cart) |
| Loading | NOT IMPLEMENTED | No loading state |
| Error | NOT IMPLEMENTED | No error state |

### Checkout

| State | Implemented | Details |
|---|---|---|
| Empty cart | Yes | Redirect message + shop link |
| Form validation errors | Yes | Per-field red error messages |
| Coupon loading | Yes | "APPLY" button disabled during validation |
| Coupon applied | Yes | Green label + code display + Remove link |
| Coupon error | Yes | Red error message |
| Payment processing | Yes | Spinner + "INITIALIZING SECURE GATEWAY..." |
| Payment failure | Partial | Generic `alert()` on error, no inline error UI |
| Payment timeout | NOT IMPLEMENTED | No timeout, spinner runs indefinitely |

### ReviewSection

| State | Implemented | Details |
|---|---|---|
| No reviews | Yes | "No reviews yet — be the first to review this drop." |
| With reviews | Yes | Summary bar + distribution + cards |
| Form submitting | Yes | "SUBMITTING..." text, button disabled (opacity 0.6) |
| Submit success | Yes | Green message "Thanks! Your review is live." |
| Submit error | Yes | Red message "Could not submit review" or "Network error" |
| Star hover | Yes | Stars fill with accent color on hover |
| Validation error | Yes | "Please pick a star rating" (if no stars selected) |

### Track page

| State | Implemented | Details |
|---|---|---|
| Default | Yes | Form with 2 inputs |
| Loading | Yes | Button text changes to "TRACKING...", disabled |
| Not found | Yes | Red text "We couldn't find that order" |
| Network error | Yes | Red text "Something went wrong" |
| Found (active) | Yes | Timeline with status progression |
| Found (cancelled) | Yes | Message + contact link |

### ProductGallery

| State | Implemented | Details |
|---|---|---|
| Default | Yes | Stacked images (desktop), scroll-snap (mobile) |
| Zoomed | Yes | Fullscreen overlay with close button |
| Image hover | Yes | Cursor changes to "ZOOM" text variant |

### SizeGuideModal

| State | Implemented | Details |
|---|---|---|
| Closed | Yes | Not rendered |
| Open | Yes | Modal with table + tips |

### Form inputs (global)

| State | Implemented | Details |
|---|---|---|
| Default | Yes | Border `--color-border` |
| Focus | Yes | Border changes to `var(--accent)` |
| Hover | NOT IMPLEMENTED | No hover border change in globals (checkout has custom) |
| Error | Yes | Red text below field (checkout only) |
| Disabled | NOT IMPLEMENTED | No disabled styling in globals |

---

## 11. ACCESSIBILITY — FACTUAL

### Semantic HTML

| Page | Structure |
|---|---|
| All pages | `<main id="main-content">` in ClientLayout |
| Info pages | `<section>` wrapper, `<h1>` title, `<h2>` sections |
| Homepage | Stacked `<section>` elements per component |
| Shop | `<section>` with `<h1>` |
| PDP | Uses `<div>` for layout grid, `<h1>` for product name |

### Skip link

Present in ClientLayout: `<a href="#main-content" className="skip-link">Skip to content</a>`. CSS: fixed top-left, z-index 1000, hidden via `transform: translateY(-100%)`, shows on focus via `translateY(0)`.

### Heading order

| Page | Heading sequence |
|---|---|
| Homepage | No h1 in HeroSection (brand text is `<span>` elements), h2 in SegmentGrid/LatestDrop/BrandManifesto |
| Shop | h1 "ALL DROPS" |
| PDP | h1 product name, h2 in ReviewSection + "YOU MAY ALSO LIKE" |
| Segment | h1 segment name (in SegmentHero), h2 in content |
| Info pages | h1 from InfoPageLayout, h2 subheadings |

**Issue:** Homepage has no `<h1>`. The hero text "BEYOND STICH" is rendered as `<span>` elements inside `<div>` elements.

### Alt text

| Component | Alt text |
|---|---|
| HeroSection | "Hero background" |
| SegmentGrid | `${segment.name} world` |
| SegmentHero | `${segmentData.name} world` |
| LatestDrop | `item.name` |
| ProductCard | `product.name` |
| ProductGallery | `${name} — image ${i + 1}` |
| CartDrawer items | `item.name` |
| CartDrawer cross-sell | `p.name` |
| OfferBanner | "Offer background" |
| Checkout items | `item.name` |
| Track items | `item.name` |
| Success page | No images |

### Focus visibility

Global in `globals.css`: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: var(--radius-sm); }`. Applied to all focusable elements.

### Keyboard operability

| Control | Keyboard support |
|---|---|
| Navbar menus | Escape closes all menus/search/mobile-menu |
| CartDrawer | Escape closes, focus trapped to close button on open |
| SizeGuideModal | Escape closes, focus to close button on open |
| ProductGallery zoom | Escape closes |
| Search overlay | Not explicitly trapped — tab can escape |
| Mega menu | Not trapped — tab can escape |
| Mobile side menu | Has `role="dialog"` + `aria-modal="true"` but no explicit focus trap |
| Star rating picker | Each star is a `<button>` — keyboard accessible |
| Color/size selectors | All `<button>` elements — keyboard accessible |

### ARIA attributes

| Component | Attributes |
|---|---|
| AnnouncementBar | `role="status"`, `aria-live="off"` |
| Navbar toggle | `aria-label`, `aria-expanded`, `aria-controls` |
| Navbar worlds | `aria-haspopup="true"`, `aria-expanded` |
| Navbar mega menu | `role="menu"`, items `role="menuitem"` |
| Navbar search | `aria-label`, `aria-expanded`, `aria-controls` |
| Navbar side menu | `role="dialog"`, `aria-modal="true"`, `aria-label="Main menu"` |
| CartDrawer | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| CartDrawer quantities | `aria-live="polite"`, `aria-label` on +/- buttons |
| ScrollProgress | `aria-hidden="true"` |
| CustomCursor | `aria-hidden="true"` |
| ProductCard wishlist | `aria-label="Add to wishlist"` |
| ProductCard star SVG | `aria-hidden="true"` |
| ProductCard swatches | `aria-label={`Colors: ${colors.join(', ')}`}` |
| SizeGuideModal | `role="dialog"`, `aria-modal`, `aria-labelledby`, `scope` on table headers |
| AnimatedHeading | `aria-label={text}` on wrapper |
| EmptyState icon | `aria-hidden="true"` |
| ReviewSection stars | `aria-label` per star button |
| Footer newsletter | `aria-label` on input, `role="status"` on success |
| ToastManager | No ARIA attributes |

### Color contrast concerns

| Pair | Foreground | Background | Calculated ratio | WCAG AA (4.5:1) |
|---|---|---|---|---|
| `--color-text-muted` on `--color-bg` | `#808080` | `#0A0A0A` | ~5.3:1 | Pass (borderline) |
| `--color-text-secondary` on `--color-bg` | `#A0A0A0` | `#0A0A0A` | ~8.1:1 | Pass |
| `--color-text-primary` on `--color-bg` | `#F8F8F8` | `#0A0A0A` | ~18.5:1 | Pass |
| `#22C55E` on `--color-bg` | `#22C55E` | `#0A0A0A` | ~8.6:1 | Pass |
| `#22C55E` on `--color-bg-card` | `#22C55E` | `#151515` | ~7.5:1 | Pass |
| `--accent-gamer` on `--color-bg` | `#00FF94` | `#0A0A0A` | ~13.4:1 | Pass |
| `--accent-coffee` on `--color-bg` | `#C4622D` | `#0A0A0A` | ~3.8:1 | **FAIL** |
| `--accent-music` on `--color-bg` | `#7C3AED` | `#0A0A0A` | ~3.1:1 | **FAIL** |
| `--accent-cars` on `--color-bg` | `#E63946` | `#0A0A0A` | ~4.4:1 | **FAIL** (borderline) |
| `--accent-valentine` on `--color-bg` | `#EF4444` | `#0A0A0A` | ~4.6:1 | Pass (borderline) |
| `--accent-randoms` on `--color-bg` | `#94A3B8` | `#0A0A0A` | ~7.2:1 | Pass |
| `--color-text-muted` on `--color-bg-card` | `#808080` | `#151515` | ~4.2:1 | **FAIL** |
| `10px` font size | — | — | — | Requires 4.5:1 minimum |

---

## 12. IMAGES & PERFORMANCE SURFACE

### Image formats & handling

| Source | Format | Method |
|---|---|---|
| Product images | Unsplash JPGs (`w=800&q=80`) | `next/image` with fill + objectFit cover |
| Segment images | Unsplash JPGs (`w=1200&q=80`) | `next/image` with fill |
| Banner images | Local PNGs (`/banners/...`) | `<picture>` with `<source>` (desktop) + `<img>` (mobile) in HeroSection; `next/image` with fill in OfferBanner |
| OG image | `/banners/og/og-default.jpg` | Metadata only |
| Favicon | `favicon.ico` | Standard |

Next.js config enables `avif` and `webp` output formats.

### Priority / lazy flags

| Component | Priority | Loading |
|---|---|---|
| HeroSection | `priority` on `<img>` inside `<picture>` | Eager |
| SegmentGrid | No priority | Default (lazy) |
| LatestDrop | No priority | Default (lazy) |
| ProductCard | No priority | Default (lazy) |
| ProductGallery | No priority | Default (lazy) |
| OfferBanner | No priority | Default (lazy) |

### Placeholder strategy

No blur placeholders, no LQIP. All images load with no placeholder — background shows `--color-bg-card` behind image containers.

### Above-the-fold image count per page

| Page | Images above fold |
|---|---|
| Homepage | 1 (hero background) |
| Shop | 4-8 (first row of product grid) |
| PDP | 1-2 (first gallery image(s)) |
| Segment | 1 (segment hero background) |
| Others | 0 |

### Sizes attribute usage

| Component | Sizes value |
|---|---|
| SegmentGrid | `(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw` |
| LatestDrop | `(max-width: 768px) 100vw, 400px` |
| ProductCard | `(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw` |
| ProductGallery | Not set (uses fill) |

### Client components that could be server components

| Component | Reason it's client | Could be server? |
|---|---|---|
| HeroSection | framer-motion animations | No (animation-dependent) |
| SegmentGrid | useInView, cursor state | No |
| LatestDrop | useInView, cursor state | No |
| BrandManifesto | useInView | No |
| SocialProofBar | useInView | No |
| OfferBanner | useInView | No |
| TrustBar | useInView | No |
| Footer | useState for newsletter | Partial — static parts could be server |
| InfoPageLayout | framer-motion on title | Could use CSS animation instead |

### Heaviest imports (estimated)

| Import | Used in | Weight |
|---|---|---|
| `framer-motion` | 20+ components | ~150KB gzip (tree-shakeable) |
| `gsap` | Not imported in any read file | ~30KB (dead weight if unused) |
| `zustand` | store.js | ~3KB |
| `next-auth` | Not imported in store routes | Dead weight |
| `razorpay` | API routes only | Server-side only |
| `mongoose` | API routes only | Server-side only |

---

## 13. INCONSISTENCIES & DEAD CODE

### Conflicting values for same purpose

| Purpose | Value 1 | Value 2 | Location |
|---|---|---|---|
| Free shipping threshold | `999` (CartDrawer hardcoded) | `999` (store.js `getShipping()`) | Duplicated, not from token |
| Shipping cost | `79` (CartDrawer, implicit) | `79` (store.js `getShipping()`) | Duplicated |
| Hero title font-size | `clamp(4rem, 14vw, 12rem)` in HeroSection CSS | `clamp(4rem, 12vw, 10rem)` in `--text-hero` token | Different clamp values for hero text |
| Overlay bg | `rgba(10, 10, 10, 0.85)` (search), `rgba(0, 0, 0, 0.7)` (side menu, size guide), `rgba(10, 10, 10, 0.95)` (gallery zoom) | Three different overlay opacities | No unified token |
| Delivery estimate | "+5 days" (success page) | "3–6 business days" (PDP) | Contradictory |
| Low stock threshold | `<= 6` (ProductCard) | `<= 3` shows "X Left" label (PDP size buttons) | Different thresholds |
| Discount calculation | `Math.round(((mrp - price) / mrp) * 100)` | Duplicated in ProductCard, PDP, and `data/products.js` | 3 locations |

### Unused/dead imports

| Item | Location | Status |
|---|---|---|
| `gsap` | `package.json` | Installed but not imported in any `src/` file read |
| `next-auth` | `package.json` | Installed but not imported in any storefront route |
| `bcryptjs` | `package.json` | Server-side only, not used in storefront pages |

### TODOs in code

| File | Content |
|---|---|
| `api/razorpay/order/route.js` | "TODO: Phase 3 (Backend Integration)" |
| `api/razorpay/verify/route.js` | "TODO: Phase 3" — signature verification bypassed |
| `Footer.jsx` | `// TODO: Wire to email marketing service (Mailchimp, Brevo, etc.)` |

### Placeholder / mock content

| Item | Location | Detail |
|---|---|---|
| Payment gateway | `api/razorpay/` | Both order and verify routes return mock data |
| Order payment status | `api/orders/route.js` | Always set to `paymentStatus: 'paid'`, `paymentMethod: 'mock'` |
| Cart placeholder image | `CartDrawer.jsx` | Fallback `/images/placeholder.jpg` — file does not exist in `public/` |
| Banner images | `banners.js` | References `/banners/hero/hero-primary-desktop.png` etc. — NOT VERIFIED whether these files exist in `public/` |
| OG image | `layout.js` | References `/banners/og/og-default.jpg` — NOT VERIFIED |
| Social proof toasts | `ToastManager.jsx` | Fake names/cities ("Ravi from Mumbai just bought") — fabricated social proof |
| Dummy product reviews | `dummyData.js` | 4 hardcoded review authors with `verified: true` |

### Hardcoded values bypassing tokens

| Value | Token available? | Location |
|---|---|---|
| `#22C55E` (green) | No token | 6 files (cart, footer, toast, review, checkout success, track) |
| `#EF4444` (red) | No token | 4 files (cart, review, product card, track) |
| `999` (free shipping) | No token | 2 files |
| `79` (shipping fee) | No token | 1 file (store.js) |
| `50` (scroll threshold px) | No token | Navbar |
| `3500` (announcement interval ms) | No token | AnnouncementBar |
| `1600` (add-to-cart flash ms) | No token | PDP |
| `1100` (loader duration ms) | No token | PageLoader |

### Misspellings in user-facing copy or code

| Text | Location | Issue |
|---|---|---|
| `MILLINIORE` | constants.js, Navbar side menu, all segment references | Likely intended "MILLIONAIRE" — misspelled throughout |
| `--accent-milliniore` | globals.css | Same misspelling in CSS variable |

### Commented-out code blocks

None found in any source file read.

---

## 14. OPEN QUESTIONS

1. **Do banner image files exist?** References to `/banners/hero/hero-primary-desktop.png`, `/banners/hero/hero-primary-mobile.png`, `/banners/offers/first-order-desktop.png`, `/banners/offers/first-order-mobile.png`, `/banners/og/og-default.jpg` in code — the `public/` directory was not fully enumerated.

2. **Does `/images/placeholder.jpg` exist?** Referenced as cart item image fallback in CartDrawer.

3. **Is GSAP actually used anywhere?** Installed in `package.json` but no import found in any file. Could be imported dynamically or in a file not read.

4. **What does the `page.module.css` hero section render on?** The homepage `page.js` imports 7 section components but `page.module.css` defines `.hero`, `.heroContent`, `.heroTitle`, `.line1`, `.line2`, `.heroTagline`, `.heroCta` — these classes are not referenced in `page.js`. They may be unused or from a previous version.

5. **Are product images self-hosted or always Unsplash?** Dummy data uses Unsplash URLs. Cloudinary is configured in `next.config.mjs` remotePatterns, suggesting production images would come from Cloudinary, but no Cloudinary URLs exist in current data.

6. **Newsletter form — is there a backend endpoint?** Footer form shows success state but never calls any API. Marked TODO.

7. **Does the mobile product gallery actually scroll-snap correctly?** The CSS sets `scroll-snap-type: x mandatory` and `scroll-snap-align: start`, but there's no JavaScript to update `activeIndex` on scroll — the pagination dots may not reflect the current visible image.

8. **What is the actual deployed domain?** Code references `https://beyondstich.com` in metadata but this may not be live.

9. **Are the Mongoose models used for any storefront server-side rendering?** Pages appear to read from `dummyData.js` via `data/products.js` rather than MongoDB directly. The transition point is unclear.

10. **ToastManager social proof — is this intentionally kept?** GROWTH-ROADMAP.md (per prior analysis) flags fake social proof for removal. The component is still active in ClientLayout.
