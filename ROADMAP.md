# Beyond Stich -- SEO Execution Roadmap

> **Brand:** Beyond Stich -- D2C streetwear (oversized graphic tees, INR 799-999, 240 GSM cotton)
> **Stack:** Next.js (App Router), MongoDB, Razorpay
> **Location:** Bangalore, India
> **Last updated:** August 2026

---

## Critical Findings (Ordered by Impact)

| # | Finding | Severity |
|---|---------|----------|
| 1 | ALL product/shop/segment/homepage content is client-rendered (CSR) -- Googlebot sees empty pages. Product schema is also client-rendered. | Critical |
| 2 | Product descriptions are ~78 characters -- critically thin content | Critical |
| 3 | No blog exists -- zero informational/commercial-investigation content | High |
| 4 | No FAQPage schema, no LocalBusiness schema, no CollectionPage schema | High |
| 5 | Auth/checkout pages are indexable -- wasting crawl budget | Medium |
| 6 | No Google Business Profile (assumed) | Medium |
| 7 | No Google Merchant Center -- missing free Shopping listings | Medium |
| 8 | Homepage H1 is a rotating carousel -- no stable keyword-rich H1 | Medium |
| 9 | Reviews are client-rendered -- long-tail keyword coverage wasted | Medium |
| 10 | No canonical tags, no noindex on utility pages | Medium |

---

## Tranche 1: Week 1-2 (Quick Wins -- High Impact, Low Effort)

### 1. Fix robots.txt to disallow auth pages

- **What:** Add `Disallow: /login`, `Disallow: /register`, `Disallow: /forgot-password`, `Disallow: /reset-password`, `Disallow: /checkout` to `beyond-stich-store/public/robots.txt`. Create the file if it does not exist.
- **Why:** Auth and checkout pages are indexable (Finding #5), wasting crawl budget on pages with no search value.
- **Effort:** 1 hour
- **Expected impact:** Reclaims crawl budget for product and content pages; prevents thin auth pages from diluting site quality signals.
- **How to measure:** Check Search Console Coverage report -- auth URLs should stop appearing in "Indexed" or "Discovered" lists within 2-4 weeks.

### 2. Add noindex to utility pages

- **What:** Add `<meta name="robots" content="noindex, nofollow" />` (via Next.js `metadata` export) to the following pages:
  - `beyond-stich-store/src/app/checkout/success/page.js`
  - `beyond-stich-store/src/app/checkout/page.js`
  - Any `/login`, `/register`, `/forgot-password`, `/reset-password` routes.
- **Why:** These pages carry no search value and should not be indexed (Finding #5, #10).
- **Effort:** 1 hour
- **Expected impact:** Prevents checkout/auth pages from appearing in search results; consolidates crawl budget on revenue-generating pages.
- **How to measure:** After deploying, use `site:beyondstich.com/checkout` in Google -- these pages should de-index within 2-4 weeks.

### 3. Add /contact and /size-guide to sitemap

- **What:** Ensure `beyond-stich-store/src/app/sitemap.js` (or `sitemap.xml`) includes `/contact` and `/size-guide` URLs. If using a dynamic sitemap, add these routes to the generation logic.
- **Why:** These pages are crawlable but not in the sitemap, reducing their discovery priority (Finding #10).
- **Effort:** 30 minutes
- **Expected impact:** Faster indexation of contact and size-guide pages; contact page supports local SEO signals.
- **How to measure:** Submit updated sitemap in Search Console; verify both URLs appear in "Submitted and indexed" within 1 week.

### 4. Add FAQPage schema to /faq

- **What:** Create a JSON-LD `FAQPage` schema block on the FAQ page. Each question-answer pair should be a `Question` entity with an `acceptedAnswer` of type `Answer`. Server-render the schema in a `<script type="application/ld+json">` tag.
- **Why:** No structured data exists for FAQ content (Finding #4). FAQPage schema is one of the easiest rich results to earn.
- **Effort:** 2 hours
- **Expected impact:** Enables FAQ rich results in Google SERPs -- expandable question/answer dropdowns directly in search results, increasing SERP real estate and click-through rate.
- **How to measure:** Validate with Google Rich Results Test immediately after deploy. Monitor Search Console Enhancements for "FAQs" within 1-2 weeks.

### 5. Add canonical URLs to all pages

- **What:** Add `canonical` to the `metadata` export in every page's layout or page component. Use the full absolute URL (e.g., `https://beyondstich.com/shop`). For product pages: `https://beyondstich.com/product/{slug}`.
- **Why:** No canonical tags exist (Finding #10), risking duplicate content issues especially for product pages accessible via multiple paths (e.g., from segment pages).
- **Effort:** 2 hours
- **Expected impact:** Consolidates ranking signals to canonical URLs; prevents Google from splitting authority across duplicate or parameterized URLs.
- **How to measure:** Run Screaming Frog or `site:` search to confirm no duplicate indexed pages. Check Search Console for reduction in "Duplicate without user-selected canonical" issues.

### 6. Fix priceValidUntil to be dynamic

- **What:** In the Product schema JSON-LD (currently in `beyond-stich-store/src/app/product/[slug]/page.js`), change `priceValidUntil` from a hardcoded past date to a dynamic value (e.g., 30 days from today: `new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]`).
- **Why:** A past `priceValidUntil` date causes Google to show a warning in Rich Results Test and may prevent Product rich results from appearing.
- **Effort:** 30 minutes
- **Expected impact:** Removes schema validation warning; ensures Product rich results remain eligible.
- **How to measure:** Run Rich Results Test on any product page -- `priceValidUntil` warning should disappear.

### 7. Add url field to Product schema

- **What:** Add `"url": "https://beyondstich.com/product/{slug}"` to the Product JSON-LD schema object.
- **Why:** The `url` field is recommended by Google for Product schema and helps search engines associate the schema with the correct page.
- **Effort:** 30 minutes
- **Expected impact:** Completes Product schema requirements; improves rich result eligibility.
- **How to measure:** Validate with Rich Results Test -- no more missing recommended fields for `url`.

### 8. Add LocalBusiness schema

- **What:** Add a JSON-LD `LocalBusiness` (or `ClothingStore`) schema to the homepage or a site-wide layout component. Include: name, address (Bangalore), phone, email, openingHours, geo coordinates, image, url, sameAs (social links).
- **Why:** No LocalBusiness schema exists (Finding #4, #6). This is critical for local search visibility in Bangalore.
- **Effort:** 2 hours
- **Expected impact:** Enables Knowledge Panel for branded searches; improves local pack ranking for "streetwear Bangalore" and similar queries.
- **How to measure:** After deploy, search "Beyond Stich Bangalore" -- a Knowledge Panel or local result should appear within 2-4 weeks (faster if paired with Google Business Profile).

### 9. Set up Google Business Profile

- **What:** Create a Google Business Profile at business.google.com. Category: "Clothing Store." Add address, phone, hours, photos of products, link to website.
- **Why:** No GBP exists (Finding #6). GBP is the single strongest local SEO signal.
- **Effort:** 2 hours (external, not code)
- **Expected impact:** Enables appearance in Google Maps and local pack results for "streetwear near me," "oversized tees Bangalore," etc.
- **How to measure:** After verification (1-2 weeks), search "Beyond Stich" on Google Maps -- listing should appear. Track impressions and actions in GBP Insights.

### 10. Fix 404 page typo

- **What:** In the 404/not-found page component, change "DOSEN'T" to "DOESN'T".
- **Why:** Typo on an error page looks unprofessional and undermines brand trust.
- **Effort:** 5 minutes
- **Expected impact:** Improved user trust on error pages (minor but zero-cost).
- **How to measure:** Visual inspection after deploy.

### 11. Add metadata to /track page

- **What:** Add a proper `metadata` export to `beyond-stich-store/src/app/track/page.js` (or its layout) with title ("Track Your Order | Beyond Stich"), description, and `noindex` (since tracking pages have no search value).
- **Why:** The track page currently has no metadata (Finding #10), and should not be indexed.
- **Effort:** 30 minutes
- **Expected impact:** Prevents a thin, untitled page from being indexed; improves crawl budget allocation.
- **How to measure:** Confirm `noindex` is present via View Source after deploy.

### 12. Update html lang to "en-IN"

- **What:** In `beyond-stich-store/src/app/layout.js`, change `<html lang="en">` to `<html lang="en-IN">`.
- **Why:** The site targets Indian English speakers. `en-IN` is more precise and helps Google understand the target audience.
- **Effort:** 5 minutes
- **Expected impact:** Slightly improves geo-targeting signals for Indian search results.
- **How to measure:** View source, confirm `lang="en-IN"`.

### 13. Add more sameAs to Organization schema

- **What:** In the Organization JSON-LD schema (likely in `beyond-stich-store/src/app/layout.js`), add all social profile URLs to the `sameAs` array: Instagram, Twitter/X, Facebook, YouTube, LinkedIn, etc.
- **Why:** `sameAs` helps Google build the brand's Knowledge Graph entity and connect the website with its social presence.
- **Effort:** 30 minutes
- **Expected impact:** Strengthens brand entity signals; may populate social links in Knowledge Panel.
- **How to measure:** Search "Beyond Stich" -- social links should appear in Knowledge Panel within 4-6 weeks.

### 14. Expand product descriptions for top 5 products

- **What:** Rewrite the product descriptions for the 5 best-selling products to 200+ words each. Include: material details (240 GSM cotton), fit guide, styling suggestions, care instructions, and relevant keywords (e.g., "oversized graphic tee for men," "streetwear Bangalore").
- **Why:** Current descriptions are ~78 characters (Finding #2) -- far too thin for Google to understand page relevance or rank for long-tail queries.
- **Effort:** 4 hours (writing + updating in database or `beyond-stich-store/src/lib/dummyData.js`)
- **Expected impact:** Top 5 product pages become eligible to rank for long-tail queries like "oversized anime tee 240 GSM cotton India."
- **How to measure:** Track impressions for long-tail product queries in Search Console. Compare before/after impressions for these 5 product pages.

### Tranche 1 Total Effort: ~16 hours

---

## Tranche 2: Month 1-3 (Core SSR Migration + Content Foundation)

### 1. Convert product page to SSR

- **What:** This is THE most impactful change. Convert `beyond-stich-store/src/app/product/[slug]/page.js` from `'use client'` to a server component. Fetch product data server-side using `async` page function. Move `ProductSchema` and `BreadcrumbSchema` to server-rendered output in `<script type="application/ld+json">` tags. Extract interactive elements (size selector, add-to-cart button, image gallery) into separate `'use client'` child components.
- **Why:** Currently Googlebot sees an empty page because all content is client-rendered (Finding #1). This single change makes product content, pricing, images, and schema visible to crawlers.
- **Effort:** 8-12 hours
- **Expected impact:** Enables Google to see ALL product content, schema, and reviews. Unlocks Product rich results (price, availability, rating in SERPs). Enables organic ranking for every product page.
- **How to measure:** After deploy, use "URL Inspection" in Search Console -- rendered HTML should show full product content. Run Rich Results Test -- Product schema should validate. Track "Valid" items in Search Console Enhancements for Products. Monitor indexed product page count.

### 2. Convert shop page to SSR

- **What:** Convert `beyond-stich-store/src/app/shop/page.js` from `'use client'` to a server component. Fetch the product catalog server-side. Server-render the product grid (names, images, prices). Keep filter/sort UI as client-side islands.
- **Why:** The shop page is the primary product discovery page, but Googlebot sees no products (Finding #1).
- **Effort:** 6-8 hours
- **Expected impact:** Google can crawl and index all product links from the shop page, improving internal link discovery. The shop page itself can rank for "buy oversized tees online India."
- **How to measure:** URL Inspection should show product grid in rendered HTML. Internal links to product pages should appear in Search Console's Links report.

### 3. Convert segment pages to SSR

- **What:** Apply the same SSR conversion to `beyond-stich-store/src/app/segment/[name]/page.js`. Server-render the segment title, description, and product grid. Keep interactive elements as client islands.
- **Why:** Segment pages (anime, gym, coffee, etc.) are key category pages but are invisible to Google (Finding #1).
- **Effort:** 6-8 hours
- **Expected impact:** Category pages can rank for segment-specific queries ("anime oversized tees India," "gym graphic tees"). Provides Google with a clear site taxonomy.
- **How to measure:** URL Inspection for segment pages shows content. Track impressions for segment-related keywords in Search Console.

### 4. Convert homepage critical sections to SSR

- **What:** In `beyond-stich-store/src/app/page.js`, server-render at minimum: `SegmentGrid` and `BrandManifesto`. Keep `HeroSection` carousel as a `'use client'` island. Fix the H1: add a static, keyword-rich `<h1>` tag above or alongside the carousel (e.g., "Beyond Stich -- Oversized Graphic Tees & Streetwear from Bangalore"). The carousel text can remain decorative but should not be the page's only H1.
- **Why:** The homepage H1 is a rotating carousel with no stable text (Finding #8). Critical content sections are invisible to Googlebot (Finding #1).
- **Effort:** 6-8 hours
- **Expected impact:** Homepage can rank for branded and non-branded queries. Stable H1 gives Google a clear keyword signal. Segment links become crawlable from the homepage.
- **How to measure:** URL Inspection for homepage shows segment grid and manifesto. `site:beyondstich.com` should show homepage with a relevant snippet (not empty or generic).

### 5. Server-render reviews on product pages

- **What:** Fetch product reviews server-side and render them in the initial HTML of the product page. The review text, author name, rating, and date should be in the HTML source. Interactive review submission form remains a client component.
- **Why:** Reviews are currently client-rendered (Finding #9). Review text contains natural long-tail keywords that Google cannot see.
- **Effort:** 4 hours
- **Expected impact:** Review content becomes indexable, adding unique long-tail keyword coverage to every product page. AggregateRating in Product schema becomes backed by visible review content.
- **How to measure:** View source on a product page -- review text should be visible in raw HTML. Track impressions for long-tail queries containing product + opinion words (e.g., "beyond stich anime tee review").

### 6. Add CollectionPage/ItemList schema to segment pages

- **What:** Add `CollectionPage` and `ItemList` JSON-LD schema to each segment page. Each product in the segment should be an `itemListElement` with `ListItem` type, including position, name, url, and image.
- **Why:** No CollectionPage schema exists (Finding #4). This structured data helps Google understand category-product relationships.
- **Effort:** 3 hours
- **Expected impact:** Enables potential carousel/list rich results for category pages. Clarifies site taxonomy for Google.
- **How to measure:** Validate with Rich Results Test. Check Search Console Enhancements for ItemList.

### 7. Expand ALL product descriptions to 200-400 words

- **What:** Rewrite descriptions for all 16 products (beyond the top 5 done in Tranche 1). Each description should include: design story/inspiration, material specs (240 GSM 100% cotton), fit details (oversized, drop-shoulder), sizing guidance, styling tips, care instructions, and relevant keywords.
- **Why:** Thin content (Finding #2) across all product pages limits ranking potential for long-tail queries.
- **Effort:** 8 hours (16 products x 30 minutes each)
- **Expected impact:** Every product page has sufficient content depth to rank for long-tail queries. Reduces bounce rate as users get the information they need.
- **How to measure:** Track total impressions and clicks for product pages in Search Console -- should increase steadily over 4-8 weeks.

### 8. Set up Google Merchant Center

- **What:** Create a Google Merchant Center account. Build an API route (`/api/feed/products`) that generates a Google Shopping product feed (XML or JSON) with all required fields: id, title, description, link, image_link, price, availability, brand, condition, gtin/mpn. Submit the feed URL in Merchant Center. Enable free listings.
- **Why:** No Merchant Center feed exists (Finding #7). Free Shopping listings are a significant untapped traffic source for D2C e-commerce.
- **Effort:** 6 hours
- **Expected impact:** Products appear in Google Shopping tab (free listings). Potential to appear in Shopping carousel on relevant searches. Direct path to paid Shopping ads when ready.
- **How to measure:** Merchant Center dashboard shows "Active" products. Track impressions and clicks from free listings in Merchant Center reporting.

### 9. Launch blog infrastructure

- **What:** Create `/blog` and `/blog/[slug]` routes in the store app. Use MDX files or a headless CMS (e.g., Sanity, Contentful) for content management. Each blog post should have: title, meta description, OG image, author, publish date, Article schema (JSON-LD), breadcrumb navigation, internal links to relevant products, and related posts.
- **Why:** No blog exists (Finding #3). Zero informational content means zero top-of-funnel organic traffic.
- **Effort:** 8 hours (infrastructure only, not content)
- **Expected impact:** Creates the foundation for ranking on informational and commercial-investigation queries (e.g., "how to style oversized tees," "best streetwear brands India 2026").
- **How to measure:** Blog index and first post should be indexed within 1 week of launch (check URL Inspection).

### 10. Publish first 10 blog posts (Tier 1 from content plan)

- **What:** Write and publish 10 high-quality blog posts targeting informational and commercial-investigation keywords. Suggested topics:
  1. "The Complete Guide to Oversized Tees: Fit, Fabric & Styling"
  2. "240 GSM vs 180 GSM Cotton: Why Fabric Weight Matters"
  3. "Top 10 Anime Graphic Tees for 2026"
  4. "Streetwear in Bangalore: The Culture Guide"
  5. "How to Style Oversized Tees for Every Occasion"
  6. "Best Gym Graphic Tees That Actually Last"
  7. "Coffee Culture Meets Streetwear: The Aesthetic"
  8. "Drop-Shoulder vs Regular Fit: What's the Difference?"
  9. "Building a Capsule Streetwear Wardrobe Under INR 5000"
  10. "The Rise of Indian Streetwear Brands"
  Each post: 1500-2500 words, 2-3 internal links to products, optimized images with alt text.
- **Why:** Informational content drives top-of-funnel traffic and builds topical authority (Finding #3).
- **Effort:** 40 hours (writing, editing, publishing)
- **Expected impact:** Each post targets 2-5 long-tail keywords. At 10 posts, potential to capture 500-2000 monthly organic visits within 3-6 months for informational queries.
- **How to measure:** Track per-post impressions and clicks in Search Console. Monitor total non-branded organic traffic from blog landing pages in GA4.

### 11. Add Google Places address autocomplete to checkout

- **What:** Integrate Google Places Autocomplete API into the checkout address form at `beyond-stich-store/src/app/checkout/page.js`. As the user types their address, suggest completions. Auto-fill city, state, and pincode.
- **Why:** Reduces checkout friction and cart abandonment. While not directly an SEO task, higher conversion rate increases the ROI of all organic traffic.
- **Effort:** 4 hours
- **Expected impact:** Reduced checkout abandonment rate (target: 5-10% improvement). Fewer failed deliveries due to address errors.
- **How to measure:** Compare checkout completion rate before/after in GA4 (funnel analysis).

### 12. Create /bangalore landing page for local SEO

- **What:** Create `beyond-stich-store/src/app/bangalore/page.js` as a dedicated local landing page. Content should include: brand story rooted in Bangalore, local streetwear culture context, address/map embed, store hours (if applicable), 500+ words of unique content, LocalBusiness schema with Bangalore geo coordinates, internal links to popular products.
- **Why:** Supports local SEO strategy (Finding #6). A dedicated geo-page helps rank for "streetwear Bangalore," "oversized tees Bangalore," etc.
- **Effort:** 4 hours
- **Expected impact:** Dedicated ranking page for Bangalore-specific queries. Reinforces local signals from Google Business Profile.
- **How to measure:** Track rankings and impressions for "streetwear Bangalore," "oversized tees Bangalore" in Search Console.

### Tranche 2 Total Effort: ~65-75 hours

---

## Tranche 3: Month 3-6 (Scale Content + Advanced)

### 1. Publish blog posts 11-30

- **What:** Continue publishing 2-3 blog posts per week. Expand into more niche topics: specific anime series styling guides, seasonal lookbooks, fabric care deep-dives, and Bangalore lifestyle content. Each post should be 1500-2500 words with internal product links.
- **Effort:** 80 hours (writing)
- **Expected impact:** Builds topical authority; compounds informational traffic to 2000-5000 monthly organic visits.
- **How to measure:** Track total blog organic traffic in GA4. Monitor keyword rankings for target clusters.

### 2. Build backlink strategy

- **What:** Pursue guest posting on Indian fashion and streetwear blogs (e.g., FLAVOR Magazine, Homegrown, NH7). Pitch brand story angles and styling guides. Target 5-10 referring domains per month.
- **Effort:** Ongoing (10 hours/month)
- **Expected impact:** Builds Domain Authority. Each quality backlink strengthens ranking potential for competitive keywords.
- **How to measure:** Track referring domains in Ahrefs/SEMrush. Monitor Domain Rating/Authority month over month.

### 3. List on Amazon/Flipkart for citation signals

- **What:** List top-selling products on Amazon.in and Flipkart. Ensure brand name consistency. Link back to main website in brand store pages where possible.
- **Effort:** 8 hours (initial setup)
- **Expected impact:** Marketplace listings create brand citations and entity signals. Marketplace SEO captures high-intent shoppers. Cross-channel presence strengthens brand recognition.
- **How to measure:** Track branded search volume over time. Monitor marketplace listing rankings.

### 4. Implement review solicitation system

- **What:** Build a post-delivery email flow: 7 days after delivery, send an automated email asking for a product review with a direct link to the review form on the product page. Include a small incentive (e.g., 10% off next order).
- **Effort:** 12 hours
- **Expected impact:** Increases review volume, which strengthens AggregateRating schema credibility. More reviews equal more unique long-tail content on product pages.
- **How to measure:** Track review submission rate (target: 5-10% of orders). Monitor review count per product.

### 5. Add product comparison features

- **What:** Create comparison pages (e.g., "/compare/anime-vs-gym-tees") that let users compare products side by side. Include structured data.
- **Effort:** 16 hours
- **Expected impact:** Captures comparison-intent queries ("X vs Y oversized tee"). Creates internal linking opportunities.
- **How to measure:** Track impressions for comparison queries in Search Console.

### 6. Implement image alt text with segment/color/material keywords

- **What:** Audit all product and blog images. Add descriptive alt text that includes relevant keywords: segment (anime, gym), color, material (240 GSM cotton), fit (oversized). Example: `alt="Black oversized anime graphic tee in 240 GSM cotton - front view"`.
- **Effort:** 4 hours
- **Expected impact:** Enables Google Image Search traffic. Images can appear in Google Shopping visual results.
- **How to measure:** Track Google Image Search impressions and clicks in Search Console (filter by "Image" search type).

### 7. Create video content for YouTube

- **What:** Produce short-form video content: product showcases, styling tips, behind-the-scenes manufacturing, Bangalore streetwear culture. Upload to YouTube with optimized titles, descriptions, and tags. Embed videos on relevant product and blog pages.
- **Effort:** Ongoing (20 hours/month)
- **Expected impact:** YouTube is the second largest search engine. Video results appear in Google SERPs for many fashion queries. Embedded videos increase time-on-page.
- **How to measure:** YouTube Analytics (views, watch time, subscriber growth). Track video carousel appearances in Google SERPs.

### 8. Add structured data for individual reviews (Review schema)

- **What:** In addition to AggregateRating on product pages, add individual `Review` schema for each review. Include: author, datePublished, reviewBody, reviewRating.
- **Effort:** 3 hours
- **Expected impact:** Richer review snippets in search results. Individual reviews can surface in Google's review-related features.
- **How to measure:** Validate with Rich Results Test. Monitor Search Console Enhancements for Reviews.

### 9. Implement pagination for shop/segment pages

- **What:** As the product catalog grows beyond 20-30 products, implement proper pagination for `/shop` and `/segment/[name]` pages. Use `rel="next"` / `rel="prev"` link elements (though Google says these are hints, they still help). Ensure each paginated page has a unique canonical URL.
- **Effort:** 6 hours
- **Expected impact:** Ensures all products remain discoverable by crawlers as catalog scales. Prevents crawl depth issues.
- **How to measure:** Monitor indexed page count in Search Console. Ensure all products appear in "Valid" pages.

### 10. Monitor and optimize based on Search Console data

- **What:** Establish a weekly Search Console review cadence. Analyze: top queries (optimize pages for rising queries), coverage errors (fix any new crawl issues), Core Web Vitals (fix any regressions), and click-through rates (improve meta titles/descriptions for pages with high impressions but low CTR).
- **Effort:** Ongoing (2 hours/week)
- **Expected impact:** Continuous improvement cycle. Catch and fix issues before they compound. Capitalize on emerging keyword opportunities.
- **How to measure:** Month-over-month organic traffic growth. Query-level CTR improvements.

### Tranche 3 Total Effort: ~130+ hours (ongoing)

---

## Measurement Framework

### Leading Indicators (Check Weekly)

| Metric | Tool | Target |
|--------|------|--------|
| Pages indexed | Google Search Console (Coverage) | All product, segment, blog pages indexed |
| Schema validation | Rich Results Test | Zero errors on Product, FAQPage, LocalBusiness, CollectionPage |
| Crawl stats | Search Console (Crawl Stats) | Steady or increasing crawl rate |
| Total impressions | Search Console (Performance) | Week-over-week growth |
| Core Web Vitals | Search Console (CWV report) | All URLs "Good" for LCP, FID/INP, CLS |

### Lagging Indicators (Check Monthly)

| Metric | Tool | Target |
|--------|------|--------|
| Organic clicks | Search Console / GA4 | Month-over-month growth |
| Organic revenue | GA4 (with e-commerce tracking) | Organic channel contributing 20%+ of revenue by month 6 |
| Keyword rankings | Ahrefs / SEMrush | Top 10 for branded; Top 30 for 20+ non-branded keywords |
| Referring domains | Ahrefs / SEMrush | 5+ new referring domains per month |
| Review volume | Internal tracking | 5-10% of orders generate a review |

### Tools Needed

| Tool | Purpose | Cost |
|------|---------|------|
| Google Search Console | Indexing, performance, coverage, CWV | Free |
| Google Analytics 4 | Traffic, conversions, e-commerce tracking | Free |
| Google Business Profile | Local SEO, Maps presence | Free |
| Google Merchant Center | Product feed, free Shopping listings | Free |
| Ahrefs or SEMrush | Keyword tracking, backlink monitoring, competitor analysis | Paid (optional but recommended) |
| Screaming Frog | Technical SEO audits, crawl simulation | Free (up to 500 URLs) |

---

## Feature Recommendations (Beyond SEO)

These features improve the site's competitiveness, user engagement, and indirectly support SEO through better signals and link-worthiness.

### 1. Wishlist sharing

Let users share their wishlists via a unique link (e.g., `beyondstich.com/wishlist/abc123`). Shared wishlists create social proof on social media and messaging apps, and each shared link is a potential backlink or social signal. Implementation: generate a shareable URL for each wishlist; render a public view of the wishlist at that URL with product images, names, and prices. Relevant file: `beyond-stich-store/src/app/account/wishlist/page.module.css` (wishlist UI already exists).

### 2. Product reviews with photos

The review system is already built, but ensure that user-uploaded review photos are optimized (compressed, served in WebP, with descriptive alt text) and rendered server-side so they are indexable. Photo reviews increase trust and conversion rate. They also add unique visual content to product pages that competitors cannot replicate.

### 3. Size recommendation quiz

Build an interactive "What's your perfect Beyond Stich size?" quiz at `/size-guide/quiz`. Ask about height, weight, preferred fit, and body type. Recommend a size with visual comparisons. This reduces returns (a major D2C cost), increases conversion confidence, and creates a unique interactive page that is inherently link-worthy (fashion bloggers and forums love linking to useful tools). The quiz page can target queries like "oversized tee size guide India" and "what size oversized tee should I get."

### 4. Segment landing page expansion

Each `/segment/[name]` page currently shows just a product grid. Add 300-500 words of unique editorial copy about that segment's culture and style. For example, the anime segment page should discuss anime-inspired streetwear culture, popular anime aesthetics in fashion, and how Beyond Stich's designs connect to that world. This transforms thin category pages into content-rich landing pages that can rank for segment-specific informational queries ("anime streetwear style guide") in addition to commercial queries.

### 5. Referral program

Implement a "Give INR 100, Get INR 100" referral program. Each customer gets a unique referral link. When shared and used, both the referrer and referee receive a discount. This drives organic word-of-mouth growth that supplements SEO. Referral links shared on social media, WhatsApp groups, and forums create additional brand mentions and potential backlinks. Track referral source to measure channel effectiveness.

---

## Timeline Summary

| Phase | Timeline | Focus | Estimated Effort |
|-------|----------|-------|-----------------|
| Tranche 1 | Week 1-2 | Quick wins: robots.txt, noindex, schema fixes, canonical tags, top 5 descriptions | ~16 hours |
| Tranche 2 | Month 1-3 | SSR migration (product, shop, segment, homepage), blog launch, Merchant Center, all descriptions | ~65-75 hours |
| Tranche 3 | Month 3-6 | Scale content (20 more posts), backlinks, video, review system, advanced schema | ~130+ hours |
| **Total** | **6 months** | **Full SEO foundation** | **~210-220+ hours** |

---

*This roadmap should be revisited monthly. Priorities may shift based on Search Console data, competitive landscape changes, and business goals.*
