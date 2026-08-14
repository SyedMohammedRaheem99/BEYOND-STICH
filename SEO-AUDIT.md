# Beyond Stich -- Comprehensive SEO Audit

**Brand:** Beyond Stich -- Premium oversized graphic tees for men  
**Domain:** beyondstich.com  
**Stack:** Next.js (App Router), MongoDB, Razorpay, Vercel (presumed)  
**Location:** Bangalore, India  
**Founder:** Mohammed Raheem  
**Date:** August 8, 2026  

---

## Table of Contents

- [Phase 1 -- Technical Reconnaissance](#phase-1--technical-reconnaissance)
- [Phase 4 -- Conversion Path Audit](#phase-4--conversion-path-audit)
- [Phase 5 -- AI Search & Off-Site Visibility](#phase-5--ai-search--off-site-visibility)

---

# Phase 1 -- Technical Reconnaissance

## 1.1 Site Structure Map

| Route Pattern | Count | Example URLs |
|---|---|---|
| Homepage `/` | 1 | `/` |
| Shop `/shop` | 1 | `/shop` |
| Segment/Collection `/segment/[name]` | 13 | `/segment/gym`, `/segment/coffee`, `/segment/millionaire`, `/segment/music`, `/segment/gamer`, `/segment/cars`, `/segment/bike`, `/segment/summer`, `/segment/floral`, `/segment/sports`, `/segment/valentine`, `/segment/typography`, `/segment/randoms` |
| Product Detail `/product/[slug]` | 16 (seed data, will grow) | `/product/mind-over-matter`, `/product/caffeine-driven` |
| Informational Pages | 8 | `/about`, `/faq`, `/contact`, `/shipping`, `/returns`, `/size-guide`, `/privacy`, `/terms` |
| Auth Pages | 4 | `/login`, `/register`, `/forgot-password`, `/reset-password/[token]` |
| Account Pages | 5 | `/account`, `/account/orders`, `/account/profile`, `/account/addresses`, `/account/wishlist` |
| Checkout Flow | 2 | `/checkout`, `/checkout/success` |
| Order Tracking | 1 | `/track` |
| **Total Indexable Pages** | **~50+** | Grows with product catalog |

### Segments (13 total)

Defined in `beyond-stich-store/src/lib/constants.js` (lines 13-90):

GYM, COFFEE, MILLIONAIRE, MUSIC, GAMER, CARS, BIKE, SUMMER, FLORAL, SPORTS, VALENTINE, TYPOGRAPHY, RANDOMS

---

## 1.2 Critical Findings

### Severity Legend

| Level | Definition |
|---|---|
| **CRITICAL** | Prevents indexing or rendering of core content. Direct revenue impact. Fix immediately. |
| **HIGH** | Significantly degrades ranking potential or user experience. Fix within 1 sprint. |
| **MEDIUM** | Missed optimization opportunity. Moderate ranking/traffic impact. Fix within 1 month. |
| **LOW** | Minor improvement. Polish-level issue. Fix when convenient. |

---

### Full Findings Table

| ID | Severity | Category | Finding | Evidence | File Path | Impact |
|---|---|---|---|---|---|---|
| SEO-001 | **CRITICAL** | Rendering | All product page content is client-side rendered (CSR). Googlebot sees empty HTML on initial crawl. Product name, description, price, images, reviews are fetched via `useEffect` + `fetch('/api/products?slug=...')`. | Line 1: `'use client';` -- the entire page component runs client-side. Only `generateMetadata` in the layout runs server-side. | `beyond-stich-store/src/app/product/[slug]/page.js` | Product pages are the primary revenue pages. Zero product content in server-rendered HTML means Googlebot indexes a blank page. No rankings possible for product keywords. |
| SEO-002 | **CRITICAL** | Structured Data | ProductSchema and BreadcrumbSchema are client-rendered. JSON-LD is injected after JavaScript hydration, not in initial HTML response. Google documentation states structured data should be present in the initial HTML. | `ProductSchema` imported on line 15 and rendered inside the `'use client'` page component. Both components output `<script type="application/ld+json">` but only after JS execution. | `beyond-stich-store/src/components/seo/ProductSchema.jsx`, `beyond-stich-store/src/components/seo/BreadcrumbSchema.jsx` | No Product rich results (price, availability, rating stars) in Google SERPs. Competitors with server-rendered schema will win the click. |
| SEO-003 | **CRITICAL** | Rendering | Shop page (`/shop`) is fully client-side rendered. Product grid fetched via client-side fetch. Crawlers see zero product listings. | Line 1: `'use client';` | `beyond-stich-store/src/app/shop/page.js` | The main catalog page is invisible to search engines. Cannot rank for "oversized tees", "graphic tees online India", etc. |
| SEO-004 | **CRITICAL** | Rendering | All 13 segment/collection pages are fully CSR. Products fetched client-side. No product content in initial HTML. | Line 1: `'use client';` | `beyond-stich-store/src/app/segment/[name]/page.js` | 13 high-value category pages (e.g., "gym graphic tees", "coffee lover tees") produce empty HTML for crawlers. Total loss of category-level organic traffic. |
| SEO-005 | **CRITICAL** | Rendering | Homepage is fully CSR. All 8 homepage components (HeroSection, LatestDrop, SegmentGrid, BrandManifesto, SocialProofBar, TrustBar, OfferBanner, ShopBanner) are `'use client'`. No product content, no brand copy, no segment links in server-rendered HTML. | HeroSection line 1: `'use client';` -- same pattern in all homepage components. | `beyond-stich-store/src/components/home/HeroSection.jsx` and all sibling components | Homepage has zero crawlable content. Googlebot sees an empty `<body>` with `<OrganizationSchema />` and `<Script>` tag only (see `layout.js` lines 61-74). Brand authority signals completely lost. |
| SEO-006 | **HIGH** | Content | Product descriptions average ~78 characters (single sentence). Google recommends 200-500 words for competitive product categories. | `'When the weights get heavy, the mind takes over. Heavyweight 240 GSM cotton built for the hardest sessions.'` = 102 characters, ~17 words. This is the LONGEST description in the seed data. | `beyond-stich-store/src/lib/dummyData.js` (line 47) | Thin content signal. Cannot rank for long-tail queries. No keyword coverage for material, fit, styling, care, or sizing. Insufficient information to reduce buyer hesitation. |
| SEO-007 | **HIGH** | Content | Homepage has 4 rotating H1 tags via carousel. Slides: "THE NEW COLLECTION IS LIVE", "END OF SEASON SALE", "WEAR THE THOUGHT", "FLAT 10% OFF YOUR FIRST ORDER". None contain category keywords. | `motion.h1` rendered on line 140 of HeroSection.jsx. Slide headlines defined in `banners.js` lines 13, 22, 31, 39. | `beyond-stich-store/src/components/home/HeroSection.jsx` (line 140), `beyond-stich-store/src/lib/banners.js` | Multiple H1 tags dilute heading signal. None include target keywords like "oversized tees", "graphic tees", "streetwear". Googlebot may index any one of the four as the page heading. |
| SEO-008 | **HIGH** | Content | No blog or content marketing infrastructure exists. Zero `/blog`, `/journal`, or `/articles` routes. | No blog-related files in the entire codebase. | N/A | All organic traffic must come from product/segment pages. Cannot rank for informational queries ("best oversized tees for gym", "how to style graphic tees", "240 GSM vs 180 GSM cotton"). No topical authority signals. |
| SEO-009 | **HIGH** | Rendering | Reviews are client-rendered only. Review bodies fetched via useEffect in the product page. Never present in server HTML. | Reviews rendered inside the `'use client'` product page component. ReviewSection is a client component imported on line 12. | `beyond-stich-store/src/app/product/[slug]/page.js` (line 12), `beyond-stich-store/src/components/product/ReviewSection.jsx` | Review text is a major source of long-tail keyword coverage (natural language, synonyms, use cases). Completely invisible to crawlers. AggregateRating in Product schema also client-rendered (lines 34-42 of ProductSchema.jsx). |
| SEO-010 | **MEDIUM** | Structured Data | No FAQPage schema on `/faq`. The page has questions and answers but zero structured data markup. | No FAQPage schema component exists in the codebase. | `beyond-stich-store/src/app/faq/page.js` | Missing FAQ rich results in Google SERPs. FAQ rich results occupy significant visual space and increase CTR. |
| SEO-011 | **MEDIUM** | Technical | No canonical URLs set on any page. No `<link rel="canonical">` tags. | Not present in `metadata` export in `layout.js` (lines 24-59). No per-page canonical configuration found. | `beyond-stich-store/src/app/layout.js` | Risk of duplicate content if URL variants resolve (trailing slashes, case variations, query parameters). Google may split ranking signals across duplicate URLs. |
| SEO-012 | **MEDIUM** | Crawl Budget | Auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password/`) not blocked from indexing. | `robots.js` disallows `/admin`, `/api/`, `/account/`, `/checkout/` but does NOT disallow `/login`, `/register`, `/forgot-password`, `/reset-password`. No `noindex` meta tag on these pages. | `beyond-stich-store/src/app/robots.js` (line 8) | Wastes crawl budget on zero-value pages. Login/register pages may appear in search results, creating a poor brand impression. |
| SEO-013 | **MEDIUM** | Crawl Budget | `/checkout/success` is indexable. Not disallowed in robots.txt, no noindex meta tag. | `robots.js` disallows `/checkout/` which should cover `/checkout/success` via prefix matching. However, the robots.txt `Disallow: /checkout/` should be verified -- Next.js robots() may or may not include the trailing slash consistently. | `beyond-stich-store/src/app/robots.js` | Success page could appear in search results with stale order confirmation content. |
| SEO-014 | **MEDIUM** | Sitemap | `/contact` and `/size-guide` missing from sitemap.xml. | `sitemap.js` static routes array (lines 10-18): includes `''`, `'/shop'`, `'/about'`, `'/terms'`, `'/privacy'`, `'/shipping'`, `'/returns'`, `'/faq'`. No `/contact` or `/size-guide`. | `beyond-stich-store/src/app/sitemap.js` (lines 10-18) | Two indexable pages not discoverable via sitemap. `/size-guide` is especially important -- it is a high-intent page that can rank for "oversized tee size guide India". |
| SEO-015 | **MEDIUM** | Structured Data | Segment pages have no CollectionPage or ItemList schema. | No schema component rendered on segment pages. | `beyond-stich-store/src/app/segment/[name]/page.js` | Missing opportunity for collection-level rich results. Google cannot understand these are category/collection pages. |
| SEO-016 | **MEDIUM** | Assets | OG images for segment pages are Unsplash URLs. External URLs not controlled by the brand. | Segment `image` fields in `constants.js` use `https://images.unsplash.com/...` URLs. | `beyond-stich-store/src/lib/constants.js` | Unsplash URLs can change or be rate-limited. OG images may break on social sharing. Brand has no control over image availability. |
| SEO-017 | **MEDIUM** | Structured Data | `priceValidUntil` hard-coded to `"2026-12-31"` in ProductSchema. | Line 23: `priceValidUntil: '2026-12-31',` | `beyond-stich-store/src/components/seo/ProductSchema.jsx` (line 23) | Will expire in ~5 months. After expiry, Product schema validation fails and rich results disappear. Must be dynamically generated or updated regularly. |
| SEO-018 | **MEDIUM** | Structured Data | Product JSON-LD schema is missing the `url` property at the top level. | Schema object (lines 6-43) does not include a `url` field. The `offers.url` exists on line 20, but the Product-level `url` is absent. | `beyond-stich-store/src/components/seo/ProductSchema.jsx` | Google's Product schema documentation recommends including the `url` property on the Product object for proper page identification. |
| SEO-019 | **MEDIUM** | Data Model | Product MongoDB model has no dedicated SEO fields. No `metaTitle`, `metaDescription`, `keywords`, or per-image `altText` fields. | ProductSchema fields (lines 17-101): `name`, `slug`, `segment`, `price`, `mrp`, `images` (array of strings, no alt text), `sizes`, `colors`, `description`, `fitType`, `material`, `tags`, `averageRating`, `reviewCount`, `viewCount`, `isActive`. | `beyond-stich-store/src/lib/models/Product.js` (lines 17-101) | Cannot customize meta tags per product. All products use the same generic title/description pattern. Images stored as URL strings with no associated alt text -- accessibility and image SEO both suffer. |
| SEO-020 | **LOW** | i18n | `<html lang="en">` should be `"en-IN"` for India targeting. | Line 63: `<html lang="en" className={...}>` | `beyond-stich-store/src/app/layout.js` (line 63) | Minor geo-targeting signal. `en-IN` tells Google this content is English for Indian users, improving regional relevance. |
| SEO-021 | **LOW** | Performance | Logo uses native `<img>` tag instead of `next/image`. No automatic WebP conversion or responsive sizing. | Logo rendered as `<img>` in the Navbar component. | `beyond-stich-store/src/components/layout/Navbar.jsx` | Slightly larger image payload on every page load. Logo is typically small so impact is minimal. |
| SEO-022 | **LOW** | Performance | Hero banner uses native `<picture>` / `<img>` instead of Next.js Image component. No automatic WebP optimization. | Lines 107-116: `<picture><source .../><img src={slide.desktop} .../></picture>` | `beyond-stich-store/src/components/home/HeroSection.jsx` (lines 107-116) | Hero is the LCP element. Missing WebP/AVIF auto-conversion. However, `fetchPriority="high"` and `loading="eager"` are correctly applied (lines 113-114). |
| SEO-023 | **LOW** | Content | Product image alt text is generic. Uses pattern `"[name] - View 1"`. | Alt text generated programmatically without segment, color, or material keywords. | `beyond-stich-store/src/components/product/ProductGallery.jsx` | Missing keyword-rich alt text like "MIND OVER MATTER oversized gym graphic tee in black - front view". Loses Google Images traffic. |
| SEO-024 | **LOW** | Content | 404 page has a typo: "DOSEN'T" should be "DOESN'T". | Line 25: `THIS DROP DOSEN'T EXIST` | `beyond-stich-store/src/app/not-found.js` (line 25) | Minor brand quality signal. Visible to users who hit a 404. Unprofessional impression. |
| SEO-025 | **LOW** | Structured Data | OrganizationSchema has only 1 `sameAs` entry (Instagram). Missing other social profiles. | Lines 18-20: `sameAs: ['https://instagram.com/beyondstich']` | `beyond-stich-store/src/components/seo/OrganizationSchema.jsx` (lines 18-20) | Limited Knowledge Panel data. Google uses `sameAs` to verify and enrich brand information. Should include all official social profiles. |
| SEO-026 | **LOW** | Internal Linking | `/about` page not linked from Footer component. | Footer links do not include an About page link. | `beyond-stich-store/src/components/layout/Footer.jsx` | Minor internal linking gap. About page receives less PageRank. Users cannot easily navigate to About from the footer. |
| SEO-027 | **LOW** | Metadata | `/track` page has no metadata export. Inherits root layout generic title "Beyond Stich -- Wear the thought." | No `export const metadata` or `generateMetadata` in the track page file. | `beyond-stich-store/src/app/track/page.js` | Generic title in SERPs if page gets indexed. Should have "Track Your Order - Beyond Stich". |

---

## 1.3 Technical Health Summary

### Positive Signals

| Area | Status | Details |
|---|---|---|
| HTTPS | Configured | Base URL is `https://beyondstich.com` (defined in `constants.js` line 9 and `layout.js` metadata) |
| Mobile Viewport | Automatic | Next.js App Router handles viewport meta tag automatically |
| Font Loading | Optimized | Barlow Condensed + Space Grotesk loaded via `next/font/google` with `display: 'swap'`. No FOIT (Flash of Invisible Text). See `layout.js` lines 10-22. |
| Razorpay Script | Non-blocking | Loaded with `strategy="lazyOnload"` (`layout.js` line 69). Does not block initial render. |
| robots.txt | Present | Blocks `/admin`, `/api/`, `/account/`, `/checkout/`. Points to sitemap. See `robots.js`. |
| Sitemap | Dynamic | Auto-generated from MongoDB products + static routes + 13 segments. See `sitemap.js`. |
| Product Card Images | Optimized | `next/image` used in product cards with automatic WebP conversion and responsive `sizes` attribute. |
| LCP Hints | Present | Hero uses `fetchPriority="high"` and `loading="eager"` (HeroSection.jsx lines 113-114). First product card uses `priority={true}`. |

### Concern Areas

| Area | Status | Details |
|---|---|---|
| CLS (Cumulative Layout Shift) | Risk | Client-side content injection means the page structure shifts when products load after hydration. Placeholder/skeleton states may mitigate but fundamental CSR architecture is the root cause. |
| FCP/LCP | Moderate Risk | Server-rendered HTML is essentially empty. FCP shows the layout chrome (navbar, footer) but no meaningful content. True LCP (product image or hero) requires JavaScript execution. |
| INP (Interaction to Next Paint) | Low Risk | Minimal interactive elements. Framer Motion animations are GPU-accelerated. Should be fine. |
| TTI (Time to Interactive) | Moderate Risk | Large client-side bundle required before any content appears. Framer Motion, Zustand, and all product data fetching happens post-hydration. |

---

## 1.4 Schema Markup Audit

| Schema Type | Present? | Location | Rendering | Issues |
|---|---|---|---|---|
| Organization | Yes | Root layout (`layout.js` line 68) -- global on every page | **Server-rendered** (component is not `'use client'`) | Only 1 `sameAs` entry (Instagram). No `telephone` field. Missing social profiles (Twitter/X, Facebook, YouTube, LinkedIn). |
| Product | Yes | Product detail page | **Client-rendered** -- inside `'use client'` page | Not in initial HTML. Missing top-level `url` property. Missing `category` property. `priceValidUntil` hardcoded to `2026-12-31`. |
| AggregateRating | Conditional | Inside Product schema | **Client-rendered** | Only rendered when `averageRating > 0 && reviewCount > 0` (ProductSchema.jsx lines 34-42). New products with zero reviews get no rating markup. |
| BreadcrumbList | Yes | Product detail page | **Client-rendered** -- inside `'use client'` page | Correct 4-item structure (Home > Shop > Segment > Product). But not in initial HTML. |
| LocalBusiness | **No** | -- | -- | Missing entirely. Should exist for a Bangalore-based business with a physical presence. |
| FAQPage | **No** | -- | -- | Missing on `/faq` page despite having structured Q&A content. |
| CollectionPage / ItemList | **No** | -- | -- | Missing on `/shop` and all 13 `/segment/[name]` pages. |
| Article | **No** | -- | -- | No blog exists, so not applicable yet. |
| WebSite (with SearchAction) | **No** | -- | -- | Missing sitelinks search box opportunity. Would enable a search box directly in Google SERPs. |

---

## 1.5 robots.txt Analysis

**File:** `beyond-stich-store/src/app/robots.js`

```javascript
rules: {
  userAgent: '*',
  allow: '/',
  disallow: ['/admin', '/api/', '/account/', '/checkout/'],
},
sitemap: `${baseUrl}/sitemap.xml`,
```

**What is correctly blocked:**
- `/admin` -- Admin panel
- `/api/` -- API routes
- `/account/` -- User account pages (no SEO value)
- `/checkout/` -- Checkout flow (covers `/checkout/success` by prefix)

**What should also be blocked:**
- `/login` -- Auth page, no SEO value
- `/register` -- Auth page, no SEO value
- `/forgot-password` -- Auth page, no SEO value
- `/reset-password/` -- Auth page, no SEO value

---

## 1.6 Sitemap Analysis

**File:** `beyond-stich-store/src/app/sitemap.js`

**Included routes:**
- Home (`/`) -- priority 1.0, changeFrequency: daily
- Shop (`/shop`) -- priority 0.9, changeFrequency: daily
- Static pages: `/about`, `/terms`, `/privacy`, `/shipping`, `/returns`, `/faq` -- priority 0.5, changeFrequency: monthly
- 13 segment pages (`/segment/gym`, etc.) -- priority 0.8, changeFrequency: weekly
- All active products (`/product/[slug]`) -- priority 0.8, changeFrequency: weekly

**Missing from sitemap:**
- `/contact` -- Contact page should be in the sitemap
- `/size-guide` -- High-intent informational page, should be in the sitemap

**Issues:**
- `lastModified` for static routes uses `new Date()` (current timestamp on every build/request). Should use the actual last-modified date of the content.
- No image sitemap entries. Product images are not included in the sitemap, missing Google Images indexing signal.

---

# Phase 4 -- Conversion Path Audit

## 4.1 Product Detail Page (Primary Landing Page)

### Above-the-Fold Content

When a user lands on a product page from search, the above-fold area contains:

1. **Product Gallery** -- 1-2 images (swipeable on mobile)
2. **Segment Badge** -- e.g., "GYM" with accent color
3. **Fit Type Badge** -- "Oversized" or "Super Oversized"
4. **Product Name** -- e.g., "MIND OVER MATTER"
5. **Star Rating + Review Count** -- e.g., 4.8 stars (42 reviews) -- only if reviews exist
6. **Price Block** -- Sale price (e.g., Rs.799) with MRP strikethrough (e.g., Rs.1299) and discount percentage (e.g., -38%)
7. **Size Selector** -- Grid of buttons (S, M, L, XL, XXL) with stock indicators
8. **ADD TO BAG button**

### Below-the-Fold Trust Signals

The TrustBar component renders 4 trust items, but they appear below the fold:

- "Free Shipping Over Rs.999"
- "Cash on Delivery Available"
- "240 GSM Premium"
- "7-Day Returns"

**Problem:** First-time buyers from organic search need to see trust signals immediately. These should be above or immediately adjacent to the ADD TO BAG button.

### Review Display

- Full review section exists: star distribution chart, individual reviews with author name, date, body text, and user-uploaded images
- Reviews are fully client-rendered (CSR) -- may flash or load with a visible delay after page paint
- New products with zero reviews show no social proof at all

### Shipping and Returns Clarity

- Mentioned briefly in the trust bar ("Free Shipping Over Rs.999", "7-Day Returns")
- Detailed policies on separate pages (`/shipping`, `/returns`)
- **No estimated delivery date on the product page** -- customers do not know when their order will arrive

### Size Guide

- "SIZE GUIDE" button opens a modal/drawer showing a measurement table
- Covers sizes S through XXL with chest, length, and shoulder measurements
- **No "how it fits" guidance** -- no model measurements, no "Model is 5'11, wearing L"
- **No size recommendation engine** -- no "Based on your height/weight, we recommend L"

### Image Assets

- Minimum 1 image required per product (enforced in schema: `beyond-stich-store/src/lib/models/Product.js` line 52)
- Seed data shows 2 images per product
- **No video content** -- no product videos, no 360-degree view
- **No lifestyle/on-model images** in seed data (Unsplash stock photos used)

---

## 4.2 Mobile Experience Assessment

| Element | Status | Notes |
|---|---|---|
| Responsive Layout | Good | Product page uses CSS Modules with responsive breakpoints |
| Size Selector | Good | Grid of tap-friendly buttons, appropriate touch target size |
| ADD TO BAG Button | Good | Full-width prominent button |
| Cart Interaction | Good | Slide-over CartDrawer component (not a separate page redirect) -- reduces friction |
| Image Gallery | Good | Swipeable with touch gestures |
| Navigation | Adequate | Hamburger menu on mobile |

---

## 4.3 Checkout Flow Analysis

### Step-by-Step Tap Count (Mobile)

| Step | Action | Taps Required |
|---|---|---|
| 1 | Product page: select size | 1 tap |
| 2 | Tap "ADD TO BAG" | 1 tap |
| 3 | Cart drawer opens: tap "GO TO CHECKOUT" | 1 tap |
| 4 | Checkout Step 1 -- ADDRESS: fill 8 form fields | 8 taps (to focus each field) + typing |
| 5 | Tap "Continue" / "Next" | 1 tap |
| 6 | Checkout Step 2 -- SUMMARY: review address, select payment method (Online / COD) | 1-2 taps |
| 7a | Online: tap "PROCEED TO SECURE PAYMENT" -> Razorpay modal | 1 tap + Razorpay flow (~3-4 taps) |
| 7b | COD: tap "PLACE ORDER" | 1 tap |
| 8 | Success page displayed | -- |

**Total taps (online payment):** ~15-18 taps minimum  
**Total taps (COD):** ~12-14 taps minimum

### Address Form Fields (8 total)

1. First Name
2. Last Name
3. Email
4. Phone
5. Address (street)
6. City
7. State
8. PIN Code

### Form Friction Assessment

| Factor | Status | Impact |
|---|---|---|
| Guest checkout | Supported | Good -- no forced account creation |
| Saved addresses | localStorage persistence for returning customers | Good -- reduces repeat purchase friction |
| First/Last name split | 2 fields instead of 1 | Minor friction -- could be a single "Full Name" field |
| Address autocomplete (Google Places) | **Not implemented** | **Significant mobile friction** -- users must type full address manually. Google Places autocomplete could reduce address entry to 1-2 taps. |
| State dropdown vs. text input | Unknown (needs verification) | If free text: risk of inconsistent data. If dropdown: additional taps. |
| PIN code auto-fill city/state | **Not implemented** | Missed opportunity -- Indian PIN codes map to specific city/state. Auto-filling after PIN entry would save 2 fields. |

---

## 4.4 Product Page Information Gaps (Bounce Risk Factors)

These are questions a buyer has when landing on a product page from search. If unanswered, the user bounces back to Google (pogo-sticking), which is a negative ranking signal.

| Question | Answered? | Details |
|---|---|---|
| "What does this tee look like?" | Partially | 2 product images (stock photos in seed data). No on-model shots, no detail close-ups, no video. |
| "Will it fit me?" | Partially | Size guide modal with measurements. But no "how it fits" copy, no model measurements, no size recommendation. |
| "What is it made of?" | Briefly | Material field shows "240 GSM Combed Cotton". No care instructions, no fabric feel description. |
| "How should I style it?" | No | No styling suggestions, no outfit pairings, no lookbook images. |
| "When will I get it?" | No | **No estimated delivery date on the product page.** User must navigate to `/shipping` to find shipping info. |
| "Can I return it?" | Briefly | "7-Day Returns" in trust bar. No details on product page. Must visit `/returns`. |
| "Is this brand legit?" | Partially | Star rating (if reviews exist), trust bar mentions. No brand story on product page. No "as seen in" press mentions. |
| "How do I wash it?" | No | **No care instructions on the product page.** Important for graphic tees (print longevity). |
| "Is this in stock in my size?" | Yes | Size selector shows stock indicators with low-stock warnings (threshold: 3 units). |
| "Are others buying this?" | Partially | Review count shown. No "X people viewing" or "Y sold this week" signals. |

---

## 4.5 Product Description Analysis

Current descriptions are critically thin. Examples from `beyond-stich-store/src/lib/dummyData.js`:

> "When the weights get heavy, the mind takes over. Heavyweight 240 GSM cotton built for the hardest sessions."

- **Character count:** 102 characters
- **Word count:** ~17 words
- **Missing information:** fit details, styling suggestions, material deep-dive, care instructions, design story, size recommendations

### What a Competitive Product Description Should Include

A product description that ranks and converts should have 200-500 words covering:

1. **Headline hook** -- emotional connection to the segment (2-3 sentences)
2. **Design story** -- inspiration, meaning of the graphic/typography (2-3 sentences)
3. **Material and construction** -- GSM, cotton type, stitching, print method (2-3 sentences)
4. **Fit and sizing** -- how oversized fits compared to regular, recommended sizing up/down (2-3 sentences)
5. **Styling suggestions** -- what to pair it with, occasions (2-3 sentences)
6. **Care instructions** -- washing, drying, ironing over print (2-3 sentences)

---

## 4.6 Revenue Impact Estimates

| Fix | Effort | Expected Impact | Priority |
|---|---|---|---|
| **Server-render product pages (SSR/SSG)** | 8-16 hours | Unlocks ALL organic product traffic. Single highest-impact fix. | P0 |
| **Server-render shop + segment pages** | 4-8 hours | Unlocks category-level organic traffic for 14 pages. | P0 |
| **Expand product descriptions to 200+ words** | 4 hours/product | Better rankings + lower bounce rate + higher conversion | P1 |
| **Add estimated delivery date on PDP** | 2 hours | Reduces "when will I get it?" anxiety. Moderate conversion lift. | P1 |
| **Google Places address autocomplete in checkout** | 4 hours | Reduces checkout abandonment on mobile. High conversion impact. | P1 |
| **Move trust signals above the fold** | 2 hours | First-time buyer confidence. Medium conversion impact. | P2 |
| **Add care instructions on PDP** | 1 hour | Reduces returns, builds trust. Low-medium impact. | P2 |
| **Add "Model wearing" info per product** | 1 hour/product | Reduces size anxiety and returns. Medium impact. | P2 |
| **Add on-model product photography** | External (photography) | Significant conversion lift. Stock photos hurt trust. | P2 |
| **PIN code auto-fill city/state** | 2 hours | Reduces checkout form friction. Low-medium impact. | P3 |

---

# Phase 5 -- AI Search & Off-Site Visibility

## 5.1 AI Search Readiness Assessment

### Current State: Nearly Invisible to AI

The site is almost completely invisible to AI search tools (ChatGPT Browse, Perplexity, Google AI Overviews, Gemini) for the following compounding reasons:

1. **All product content is client-rendered.** AI crawlers (Perplexity's bot, ChatGPT's browsing tool, Google's AI Overview generator) may not execute JavaScript reliably. Even if they do, the latency of JS execution + API fetch means the crawler may time out before content appears.

2. **Descriptions are too short to contain extractable facts.** AI tools prefer content with clear, definitive factual statements they can cite. A 17-word description provides nothing quotable.

3. **No FAQ schema.** Google AI Overviews heavily pull from FAQPage structured data. The `/faq` page has Q&A content but no schema markup.

4. **No blog or editorial content.** AI tools build topical understanding from long-form content. Without blog posts about oversized tees, fabric quality, streetwear styling, or the Indian streetwear scene, AI tools have no reason to cite Beyond Stich as an authority.

5. **No comparison or "best of" content.** Queries like "best oversized tees in India" or "240 GSM vs 180 GSM cotton tees" are prime AI Overview triggers. Beyond Stich has no content to surface for these.

---

## 5.2 Making Content Citable by AI

### Principle: AI tools cite content that contains clear, factual, structured statements.

**Action 1: Server-render all product content**

AI crawlers need to see content in raw HTML. This is the same fix as SEO-001 through SEO-005 but is doubly important for AI visibility. Perplexity and ChatGPT Browse are less likely to execute client-side JavaScript than Googlebot.

**Action 2: Write extractable factual statements in product descriptions**

Bad (current):
> "When the weights get heavy, the mind takes over. Heavyweight 240 GSM cotton built for the hardest sessions."

Good (AI-citable):
> "The Mind Over Matter oversized gym tee is made from 240 grams-per-square-meter combed cotton, weighs approximately 280 grams in size L, and features a relaxed oversized fit that runs 2 sizes larger than standard Indian sizing. The graphic is printed using DTG (direct-to-garment) technology for long-lasting color that survives 50+ washes. Available in sizes S through XXL. Designed and shipped from Bangalore, India."

The second version contains specific, verifiable facts that an AI can extract and cite: GSM weight, cotton type, fit comparison, print method, wash durability, size range, origin.

**Action 3: Add FAQPage schema to `/faq`**

Google AI Overviews pull heavily from FAQ structured data. Implement the `FAQPage` schema type with `Question` and `Answer` entities.

Consider also adding FAQ sections to individual product pages with product-specific questions:
- "What size should I get in the Mind Over Matter tee?"
- "How do I wash this graphic tee without damaging the print?"
- "Does this tee shrink after washing?"

**Action 4: Create comparison and educational content**

Blog posts or standalone pages that AI tools can cite:

- "Oversized vs Regular Fit Tees: A Complete Guide"
- "What Does 240 GSM Mean? Understanding T-Shirt Fabric Weight"
- "How to Style Oversized Graphic Tees: 10 Outfit Ideas"
- "The Best Oversized Tees for the Gym: What to Look For"
- "Direct-to-Garment vs Screen Printing: Which Lasts Longer?"

These are the exact queries users ask ChatGPT and Perplexity. The brand that provides the best answer becomes the cited source.

**Action 5: Use definitive, brand-attributed language**

Instead of generic claims:
> "We use premium fabric"

Use specific, brand-attributed statements:
> "Beyond Stich tees use 240 GSM combed cotton sourced from Tirupur, Tamil Nadu"

AI tools prefer statements that are specific, attributable to a source, and verifiable.

**Action 6: Structure content with clear headings and concise answers**

AI tools prefer content structured as:
```
## Question/Topic (H2)
[1-3 sentence direct answer]
[Supporting detail paragraph]
```

This mirrors the "question -> answer" pattern that AI Overviews, Perplexity answers, and ChatGPT citations are optimized to extract.

---

## 5.3 Third-Party Surfaces Strategy

### Marketplaces

| Platform | Priority | Action | Benefit |
|---|---|---|---|
| **Amazon India** | High | List products on Amazon.in with "Beyond Stich" branding | Creates a citation signal. Amazon product pages rank independently for product queries. Drives brand awareness. |
| **Flipkart** | High | List on Flipkart Fashion | India's second-largest e-commerce platform. Different audience than Amazon. |
| **Myntra** | Medium | Apply for brand registration on Myntra | Premium fashion positioning. High purchase intent audience. |
| **Ajio** | Medium | List on Ajio (Reliance platform) | Growing fashion marketplace. |
| **Meesho** | Low | Consider for volume/tier-2 city reach | Different demographic. May dilute brand positioning. |

Each marketplace listing creates an independent page that ranks in Google, mentions the brand, and drives branded search queries back to the main website.

### Community and Social Platforms

| Platform | Action | Target Queries |
|---|---|---|
| **Reddit** | Active participation in r/IndianStreetWear, r/IndianFashionAddicts, r/bangalore, r/malefashionadvice (India threads) | "best oversized tees India", "where to buy graphic tees Bangalore" |
| **Quora** | Answer questions about oversized tees, streetwear in India, graphic tee quality | "best oversized t-shirts for men in India", "is 240 GSM good for t-shirts" |
| **Instagram** | Already present @beyondstich. Ensure link-in-bio points to website (not Linktree). Use Shopping tags. | Brand awareness, product discovery |
| **YouTube** | Create content: "How We Make Our Tees", "240 GSM Cotton Explained", styling videos | YouTube results appear in Google search. Video carousels in SERPs. |
| **Pinterest** | Create product pins for each tee. Rich pins with price and availability. | Pinterest has high purchase intent. Pins rank in Google Images. |
| **Twitter/X** | Brand account for drops, offers, customer interactions | Additional `sameAs` signal for Knowledge Panel |

---

## 5.4 Google Business Profile Strategy (Bangalore)

### Current State

- No `LocalBusiness` schema on the website
- Unknown whether a Google Business Profile (GBP) exists

### Setup Actions

1. **Create or claim** Google Business Profile for "Beyond Stich"
2. **Primary category:** "Clothing store" or "T-shirt store"
3. **Address:** Registered business address in Bangalore (as mentioned on the About page)
4. **Business type:** Online retail with local presence
5. **Phone:** Add a dedicated business phone number
6. **Website:** Link to `https://beyondstich.com`
7. **Hours:** Set business hours for customer support availability

### Optimization Actions

| Action | Frequency | Details |
|---|---|---|
| Upload product photos | Weekly | New product drops, flat-lays, on-model shots |
| Upload workspace/packaging photos | Monthly | Behind-the-scenes builds authenticity |
| Google Posts | Weekly | New drops, sales, offers, blog posts |
| Respond to reviews | Within 24 hours | Every review, positive or negative |
| Pre-populate Q&A | One-time + ongoing | Common questions: sizing, delivery times, COD availability, return process |
| Add attributes | One-time | COD available, delivery available, price range (Rs.500-Rs.1500), online appointments: no |
| Request reviews | Ongoing | Post-delivery email/SMS asking for Google review |

### LocalBusiness Schema Implementation

Add a `LocalBusiness` schema component to the root layout (alongside the existing `OrganizationSchema`):

```json
{
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "name": "Beyond Stich",
  "url": "https://beyondstich.com",
  "logo": "https://beyondstich.com/logos/beyond-stich-logo.png",
  "image": "https://beyondstich.com/banners/og/og-default.jpg",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Bangalore",
    "addressRegion": "Karnataka",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "12.9716",
    "longitude": "77.5946"
  },
  "priceRange": "Rs.500 - Rs.1500",
  "paymentAccepted": "UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery",
  "currenciesAccepted": "INR",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  }
}
```

---

## 5.5 Google Merchant Center -- Free Product Listings

### Priority: HIGH

Google Merchant Center allows free product listings in Google Shopping results. This is free traffic with high purchase intent.

### Requirements Checklist

| Requirement | Current Status | Action Needed |
|---|---|---|
| Product structured data (price, availability) | Exists but client-rendered | Server-render ProductSchema (fixes SEO-002) |
| Product data feed | Does not exist | Create `/api/feed/google` route (see below) |
| Shipping info in Merchant Center | Not configured | Configure shipping rates in GMC dashboard |
| Returns policy page | Exists at `/returns` | Link in GMC settings |
| Website verification | Not done | Verify via Search Console or meta tag |
| Product images (high quality, white background) | Unsplash stock photos | Replace with actual product photography |

### Product Feed Implementation

Create a server-side API route at `/api/feed/google` that outputs products in Google's required TSV or XML format:

**Required fields per product:**
- `id` -- product slug or MongoDB `_id`
- `title` -- product name + segment + "Oversized Graphic Tee"
- `description` -- product description (must be 200+ chars for Merchant Center)
- `link` -- full URL to product page
- `image_link` -- primary product image URL
- `price` -- e.g., "799 INR"
- `availability` -- "in_stock" or "out_of_stock"
- `brand` -- "Beyond Stich"
- `condition` -- "new"
- `google_product_category` -- "Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts"
- `product_type` -- "Oversized Graphic Tees > [SEGMENT]"
- `shipping` -- weight, shipping cost/free threshold

**The feed can be auto-generated** from the MongoDB `products` collection, pulling the same data that the API already serves to the client. This is a high-value, low-effort implementation.

---

## 5.6 Local Citation Strategy (NAP Consistency)

NAP = Name, Address, Phone. Must be identical across all listings.

**Canonical NAP:**
- **Name:** Beyond Stich
- **Address:** [Bangalore address from business registration]
- **Phone:** [Dedicated business phone number]

### Citation Sources

| Platform | Type | Priority | Action |
|---|---|---|---|
| Google Business Profile | Primary | Critical | Create/claim and optimize (see 5.4) |
| JustDial | Local directory | High | Create listing with exact NAP |
| IndiaMART | B2B marketplace | Medium | Only if doing bulk/corporate orders |
| Sulekha | Local directory (Bangalore) | Medium | Create listing with exact NAP |
| Yellow Pages India | Directory | Low | Basic listing for citation count |
| Instagram bio | Social | High | Ensure business name, location, and website URL are present |
| Facebook Page | Social | Medium | Create page with exact NAP + link to website |
| LinkedIn Company Page | Social | Low | Create company page (adds `sameAs` signal) |

### NAP Consistency Rules

1. Always use "Beyond Stich" (not "BeyondStich", "Beyond-Stich", or "beyond stich")
2. Address format must be identical everywhere -- same abbreviations, same line breaks
3. Phone number must use the same format everywhere (with or without country code, but consistent)
4. Audit citations quarterly for drift

---

## Priority Action Matrix (All Phases)

| Priority | Action | Phase | Effort | Impact |
|---|---|---|---|---|
| **P0** | Server-render product pages (convert from CSR to SSR/SSG) | Phase 1 | 8-16 hours | Unlocks all organic product traffic + AI visibility |
| **P0** | Server-render shop + segment pages | Phase 1 | 4-8 hours | Unlocks category organic traffic |
| **P0** | Server-render homepage components | Phase 1 | 4-8 hours | Unlocks homepage organic signals |
| **P0** | Server-render ProductSchema + BreadcrumbSchema | Phase 1 | 2 hours | Enables rich results in Google |
| **P1** | Expand product descriptions to 200+ words | Phase 4 | 4 hrs/product | Rankings + conversion |
| **P1** | Add estimated delivery date on PDP | Phase 4 | 2 hours | Conversion lift |
| **P1** | Implement Google Places address autocomplete | Phase 4 | 4 hours | Checkout conversion |
| **P1** | Set up Google Merchant Center + product feed | Phase 5 | 8 hours | Free Shopping traffic |
| **P2** | Add FAQPage schema to /faq | Phase 1 | 1 hour | FAQ rich results + AI Overviews |
| **P2** | Add canonical URLs site-wide | Phase 1 | 2 hours | Prevent duplicate content |
| **P2** | Block auth pages from indexing | Phase 1 | 30 min | Crawl budget |
| **P2** | Add missing pages to sitemap | Phase 1 | 30 min | Indexing coverage |
| **P2** | Create Google Business Profile | Phase 5 | 2 hours | Local visibility |
| **P2** | Move trust signals above fold on PDP | Phase 4 | 2 hours | First-time buyer conversion |
| **P3** | Build blog infrastructure | Phase 5 | 16 hours | Long-term topical authority |
| **P3** | Add CollectionPage/ItemList schema to segments | Phase 1 | 2 hours | Collection rich results |
| **P3** | Fix 404 typo "DOSEN'T" | Phase 1 | 5 minutes | Brand quality |
| **P3** | Change `lang="en"` to `lang="en-IN"` | Phase 1 | 5 minutes | Geo-targeting |
| **P3** | Add SEO fields to Product model | Phase 1 | 2 hours | Per-product SEO control |
| **P3** | Update `priceValidUntil` to be dynamic | Phase 1 | 30 min | Prevent schema expiry |

---

*End of SEO Audit -- Phases 1, 4, and 5*
