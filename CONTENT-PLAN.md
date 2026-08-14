# Beyond Stich — 30-Post Blog Content Plan

**Brand:** Beyond Stich (D2C streetwear, Bangalore, India)
**Product:** Premium oversized graphic tees, 240 GSM combed cotton, Rs 799-999
**Segments:** GYM, COFFEE, MILLIONAIRE, MUSIC, GAMER, CARS, BIKE, SUMMER, FLORAL, SPORTS, VALENTINE, TYPOGRAPHY, RANDOMS
**Goal:** Build topical authority, drive organic traffic to collection/product pages, fill massive content gap

---

## 1. Blog URL Structure & Taxonomy

### Recommended URL Structure: Flat (`/blog/[slug]`)

Use `/blog/[slug]` — NOT nested `/blog/[category]/[slug]`.

**Reasons:**

1. **Simplicity at this scale.** 30 posts do not need category nesting. Flat slugs are shorter, easier to share, and rank identically.
2. **Flexibility.** A post like "best oversized tees for gym" could live under /blog/fashion/ or /blog/gym/. Flat structure avoids that forced choice.
3. **No URL migrations.** If you rename or merge categories later, flat URLs survive. Nested URLs create redirect debt.
4. **Google does not use URL path hierarchy as a ranking signal.** Category structure should live in internal linking and breadcrumbs, not in the URL itself.

**URL examples:**
- `/blog/best-oversized-tees-for-gym`
- `/blog/how-to-style-oversized-tees`
- `/blog/oversized-tee-size-guide`
- `/blog/streetwear-stores-bangalore`

### Category Taxonomy (for UI filtering and breadcrumbs, NOT URL paths)

| Category Slug | Display Name | Purpose |
|---|---|---|
| `buying-guides` | Buying Guides | Commercial-investigation posts ("Best X for Y") |
| `style-tips` | Style Tips | How-to-wear, outfit pairing, seasonal styling |
| `fabric-care` | Fabric & Care | Material education, washing, longevity |
| `culture` | Street Culture | Streetwear history, subculture, local scene |
| `comparisons` | Comparisons | X vs Y, material comparisons, brand-agnostic |

### Technical Implementation (Next.js App Router)

```
beyond-stich-store/src/app/blog/
  page.js              → Blog index (paginated, filterable by category)
  [slug]/
    page.js            → Individual blog post
```

**Data layer:** Store posts as MDX files in `/content/blog/` or use a headless CMS (Sanity, Contentful). For a 30-post library, MDX with frontmatter is sufficient and keeps everything in the repo.

**Frontmatter schema per post:**
```yaml
title: "Best Oversized Tees for Gym — 2026 Guide"
slug: "best-oversized-tees-for-gym"
category: "buying-guides"
publishedAt: "2026-08-15"
updatedAt: "2026-08-15"
description: "Meta description here, 150-160 chars"
linkedSegments: ["gym"]
linkedProducts: ["mind-over-matter", "iron-discipline"]
featuredImage: "/blog/gym-tees-hero.jpg"
```

**generateMetadata():** Pull title, description, and OG image from frontmatter. No `keywords` meta tag (Google ignores it — see Section 5).

**generateStaticParams():** Pre-render all blog slugs at build time for instant load.

---

## 2. 30-Post Editorial Calendar

### TIER 1: Highest Conversion Potential (Posts 1-10)

These are commercial-investigation and transactional posts. Publish first. They target people who are ready to buy or actively comparing options.

| # | Working Title | Primary Keyword + Supporting Cluster | Intent | Words | Scope | Must Link To | Angle | Est. Monthly Search Vol |
|---|---|---|---|---|---|---|---|---|
| 1 | Best Oversized T-Shirts for Men in India (2026) | `best oversized t-shirts for men` + `oversized tees india`, `premium oversized tshirts`, `240 gsm tshirt` | Commercial-investigation | 2,500 | National | /shop, /segment/gym, /segment/typography, /product/mind-over-matter, /product/iron-discipline, /product/words-hit-harder | Every existing "best oversized tee" listicle is either affiliate spam or lists Bewakoof/Souled Store. This post comes from a brand that actually manufactures them — include fabric weight comparison table, real wash-test photos, and GSM explainer that no affiliate can replicate. | 12,000 |
| 2 | Oversized T-Shirt Size Guide: How Should an Oversized Tee Actually Fit? | `oversized t-shirt size guide` + `how should oversized tee fit`, `oversized tshirt measurements`, `oversized vs regular fit` | Commercial-investigation | 1,800 | National | /shop, /product/iron-discipline (Super Oversized example), /product/caffeine-driven (Oversized example) | Most size guides are generic XS-XL charts. This one explains the actual difference between "Oversized" and "Super Oversized" fit types with on-body photos at different heights/builds. Solves the #1 pre-purchase anxiety for online tee buyers. | 6,500 |
| 3 | 240 GSM vs 180 GSM T-Shirts: Which Fabric Weight Is Worth Your Money? | `240 gsm tshirt` + `gsm meaning in t-shirts`, `heavyweight t-shirt india`, `180 vs 240 gsm` | Commercial-investigation | 2,000 | National | /product/mind-over-matter (240 GSM), /product/endless-summer (180 GSM), /shop | Nobody in the Indian D2C space has explained GSM with actual side-by-side drape tests, transparency checks, and wash longevity data. This becomes the definitive GSM reference post for Indian buyers. | 4,800 |
| 4 | 10 Best Graphic Tees for the Gym That Actually Look Good | `graphic tees for gym` + `gym t-shirts for men`, `oversized gym tshirt`, `workout graphic tees` | Commercial-investigation | 2,200 | National | /segment/gym, /product/mind-over-matter, /product/iron-discipline, /segment/sports | Every gym tee listicle recommends dri-fit performance wear. This post makes the case for heavyweight cotton oversized tees AS gym wear — the comfort argument, the aesthetics argument, the durability argument. Includes "gym tee decision matrix" (material vs activity type). | 8,200 |
| 5 | How to Style Oversized T-Shirts: 12 Outfit Ideas for Men | `how to style oversized t-shirt men` + `oversized tshirt outfit ideas`, `men streetwear outfits india`, `oversized tee with jeans` | Commercial-investigation | 2,500 | National | /shop, /segment/floral, /segment/typography, /segment/summer, /product/bloom-different, /product/words-hit-harder, /product/endless-summer | Indian men's styling content is either hyper-Western (doesn't translate) or "5 tips for men" clickbait. This post shows real outfit builds with Indian context — what works with chinos from local brands, how to layer in Bangalore winter vs Delhi winter, etc. | 9,500 |
| 6 | Best Oversized T-Shirts Under 1000 Rupees (That Don't Feel Cheap) | `oversized tshirts under 1000` + `best tshirts under 999`, `affordable premium tees india`, `cheap oversized tees` | Transactional | 1,800 | National | /shop (filtered by price), /product/mind-over-matter (Rs 799), /product/overtime (Rs 799), /product/night-rider (Rs 799) | Price listicles exist, but they list fast-fashion garbage. This post filters by GSM > 200, actual customer reviews, print durability, and stitching quality. Beyond Stich products naturally qualify because the entire catalog is Rs 699-999. | 14,000 |
| 7 | Streetwear T-Shirts for Men: What Makes a Tee "Streetwear" (and What Doesn't) | `streetwear t-shirts for men india` + `streetwear brands india`, `street style tshirts`, `urban graphic tees` | Commercial-investigation | 2,000 | National | /shop, /segment/music, /segment/gamer, /segment/randoms, /product/synth-wave, /product/no-respawns, /product/glitch-in-the-system | Most "streetwear" content in India conflates it with athleisure. This post defines streetwear properly — graphic-driven, subculture-rooted, oversized silhouettes — and positions Beyond Stich's segment-based approach as authentic streetwear curation. | 5,400 |
| 8 | Coffee Lover Gifts for Men: 15 Ideas Beyond the Mug | `coffee lover gifts for men` + `gifts for coffee lovers india`, `coffee themed tshirt`, `unique gifts for him` | Transactional | 2,000 | National | /segment/coffee, /product/caffeine-driven, /product/espresso-yourself | Gift guides for coffee lovers always list mugs, grinders, and subscriptions. This post includes those but leads with wearable coffee culture — the "gift they'll actually use daily" angle. Beyond Stich's coffee segment gets prominent but natural placement. | 6,100 |
| 9 | Valentine's Day Gifts for Boyfriend: The Anti-Basic Guide | `valentine gifts for boyfriend india` + `unique valentine gifts for him`, `valentine tshirt for men`, `couple gifts india` | Transactional | 2,200 | National (seasonal) | /segment/valentine, /product/heartless, /segment/typography | Valentine gift guides are an SEO bloodbath in January. This post publishes early (December), takes the "anti-basic" angle (no teddy bears, no wallets), and positions graphic tees as a statement gift. Seasonal but massive volume spike. | 22,000 (seasonal peak in Jan-Feb) |
| 10 | Gamer T-Shirts That Don't Look Like Merch Booth Rejects | `gamer t-shirts for men` + `gaming graphic tees india`, `esports tshirts`, `gamer fashion` | Commercial-investigation | 1,800 | National | /segment/gamer, /product/no-respawns, /segment/music | Every gamer tee listicle shows cringe "I paused my game to be here" text tees. This post curates tees with subtle, design-forward gaming references — pixel art, glitch aesthetics, controller silhouettes — that you'd wear outside the house. | 3,800 |

### TIER 2: Topical Authority Builders (Posts 11-20)

Medium conversion potential. These build subject-matter authority around oversized tees, streetwear, and specific lifestyle segments.

| # | Working Title | Primary Keyword + Supporting Cluster | Intent | Words | Scope | Must Link To | Angle | Est. Monthly Search Vol |
|---|---|---|---|---|---|---|---|---|
| 11 | How to Wash Graphic Tees Without Destroying the Print | `how to wash graphic tees` + `graphic tshirt care`, `print fading prevention`, `washing oversized tshirts` | Informational | 1,500 | National | /shop, /product/silent-moves (gold foil — special care), /product/night-rider (reflective ink) | Most care guides are generic "wash cold, hang dry." This post covers SPECIFIC print types — screen print, DTG, foil, reflective — with different care instructions for each. Includes a printable care cheat sheet. | 3,200 |
| 12 | Oversized vs Regular Fit vs Slim Fit: A Visual Comparison | `oversized vs regular fit tshirt` + `tshirt fit guide men`, `drop shoulder vs regular`, `relaxed fit vs oversized` | Informational | 1,800 | National | /shop, /product/iron-discipline (Super Oversized), /product/caffeine-driven (Oversized) | Fit comparison posts use stock photos of models. This post shows THE SAME person in all three fits, side by side, with measurements overlaid. Visual proof, not marketing copy. | 4,200 |
| 13 | What Does GSM Mean in T-Shirts? The Only Guide You Need | `gsm meaning in t-shirts` + `what is gsm fabric`, `gsm chart for tshirts`, `best gsm for tshirts` | Informational | 1,600 | National | /product/mind-over-matter (240 GSM), /product/endless-summer (180 GSM), /shop | This is the definitive entity page for "GSM in t-shirts." Covers the full range (120-300 GSM), when each weight makes sense, and why Indian summers need different GSM than Indian winters. | 8,800 |
| 14 | Best Bike Rider T-Shirts: Gear That Rides as Hard as You | `bike rider t-shirts` + `motorcycle tshirt india`, `biker graphic tees`, `Royal Enfield tshirt` | Commercial-investigation | 1,800 | National | /segment/bike, /product/night-rider, /segment/cars | Biker tee content is dominated by Harley-Davidson merch and official Royal Enfield gear. This post covers the independent graphic tee scene — designs that nod to riding culture without being a billboard for a motorcycle brand. | 2,900 |
| 15 | Motorsport and Car Graphic Tees for Petrolheads | `car graphic tees` + `motorsport t-shirts india`, `car lover tshirt`, `JDM tshirt india` | Commercial-investigation | 1,600 | National | /segment/cars, /product/redline, /segment/bike | JDM and motorsport culture is growing in India but merch options are trash-tier Alibaba prints. This post curates tees with actual design quality — subtle references, proper typography, prints that car people recognize. | 2,100 |
| 16 | What Is Combed Cotton? Why Your Tee's Fabric Matters More Than Its Design | `combed cotton t-shirt` + `combed vs regular cotton`, `best cotton for tshirts`, `ring spun cotton india` | Informational | 1,500 | National | /shop, /product/mind-over-matter (240 GSM combed cotton), /product/iron-discipline | Fabric content posts exist on textile B2B sites but not from consumer brands. This post translates fabric science into "why this matters for how your tee feels after 20 washes" language. | 3,600 |
| 17 | Music Festival Outfit Ideas for Men (India Edition) | `music festival outfit men india` + `concert outfit ideas`, `what to wear to music festival`, `nh7 weekender outfit` | Informational | 2,000 | National | /segment/music, /product/synth-wave, /product/late-night-loop, /segment/summer | Festival fashion content is entirely Western (Coachella, Glastonbury). This post covers Indian festivals — NH7 Weekender, Sunburn, Ziro — with weather-appropriate, crowd-practical outfit builds. | 2,400 |
| 18 | Millionaire Mindset T-Shirts: Hustle Culture Fashion That Actually Looks Good | `millionaire mindset tshirt` + `hustle culture tshirts`, `motivational graphic tees`, `entrepreneur tshirts india` | Commercial-investigation | 1,600 | National | /segment/millionaire, /product/silent-moves, /segment/typography | "Hustle culture" tees are usually black-on-white text saying "GRIND" in Impact font. This post argues for elevated execution — gold foil, restrained typography, premium fabric — as the actual way to signal ambition through clothing. | 1,800 |
| 19 | Floral T-Shirts for Men: How to Wear Florals Without Looking Lost | `floral t-shirts for men` + `men floral print tshirt`, `how to wear floral shirt men`, `botanical tee` | Informational | 1,800 | National | /segment/floral, /product/bloom-different, /segment/summer | Indian men avoid florals because they associate them with Hawaiian shirts or "uncle prints." This post reframes florals through a streetwear lens — dark bases, oversized cuts, botanical (not tropical) prints. | 2,600 |
| 20 | Typography T-Shirts: When the Font IS the Design | `typography t-shirts` + `text tshirts for men`, `typographic tee`, `statement tshirts india` | Commercial-investigation | 1,400 | National | /segment/typography, /product/words-hit-harder, /segment/millionaire | Typography tee posts show random quote tees. This post explores typography AS design — font choice, kerning, weight, negative space — and why a well-typeset tee is harder to design than a graphic one. | 1,500 |

### TIER 3: Long-Tail, Informational & AI-Citability (Posts 21-30)

Lower direct conversion, but these build topical depth, capture informational queries, and make the site citable by AI assistants (Google SGE, ChatGPT, Perplexity).

| # | Working Title | Primary Keyword + Supporting Cluster | Intent | Words | Scope | Must Link To | Angle | Est. Monthly Search Vol |
|---|---|---|---|---|---|---|---|---|
| 21 | Best Streetwear Stores in Bangalore (Online + Offline) | `streetwear stores in bangalore` + `streetwear brands bangalore`, `where to buy streetwear bangalore`, `graphic tees bangalore` | Local | 2,500 | Bangalore-local | /shop, /segment/randoms, /about | Local listicles for Bangalore streetwear are either outdated or list only big malls. This is a curated, regularly-updated local guide featuring pop-ups, Instagram brands, and independent stores — with Beyond Stich included naturally as a Bangalore-based brand. | 1,200 |
| 22 | Streetwear Culture in India: From Colaba Causeway to Instagram Drops | `streetwear culture india` + `indian streetwear history`, `streetwear brands india 2026`, `indian street fashion` | Informational | 3,000 | National | /shop, /about, /segment/music, /segment/gamer | No comprehensive long-form piece on Indian streetwear evolution exists. This fills that vacuum — from Colaba Causeway bootlegs to Veg Non Veg to Instagram D2C drops. Beyond Stich contextualizes itself within the movement. AI systems will cite this as a source on "Indian streetwear." | 1,800 |
| 23 | Drop Shoulder T-Shirts: Why the Silhouette Matters | `drop shoulder t-shirt` + `drop shoulder vs regular tshirt`, `what is drop shoulder`, `oversized drop shoulder tee` | Informational | 1,400 | National | /shop, /product/iron-discipline, /product/no-respawns | Drop shoulder is a search term with high volume but zero good explanations. This becomes the entity-definition page — what it is, how it drapes differently, who it flatters, and why it became the default streetwear cut. | 5,500 |
| 24 | Summer T-Shirts for Men: What to Wear When India Decides to Melt | `summer t-shirts for men india` + `lightweight tshirts for summer`, `breathable tshirts india`, `what to wear in indian summer` | Informational | 1,800 | National | /segment/summer, /product/endless-summer (180 GSM), /segment/floral | Summer tee content recommends "linen and pastels" — useful in London, useless in 42C Chennai. This post covers GSM choices for Indian heat, light vs dark color heat absorption, and armpit-friendly fits. | 7,200 |
| 25 | What to Wear to the Gym: A Guide for Men Who Aren't Fitness Influencers | `what to wear to gym men` + `gym outfit ideas men`, `gym clothing guide`, `casual gym wear men` | Informational | 1,800 | National | /segment/gym, /product/mind-over-matter, /segment/sports | Gym outfit guides show shredded dudes in matching sets. This post is for normal guys who want to look decent without buying a gym-specific wardrobe — and makes the case that oversized graphic tees solve the problem. | 6,800 |
| 26 | How to Shrink-Proof Your Favorite T-Shirts | `how to prevent t-shirt shrinking` + `does cotton shrink`, `pre-shrunk cotton tshirt`, `tshirt shrinkage guide` | Informational | 1,200 | National | /shop, /product/mind-over-matter | Practical utility post that answers a common anxiety, especially for Rs 800+ tees. Covers pre-shrunk vs non-pre-shrunk cotton, first-wash protocols, and dryer alternatives for Indian households (most don't have dryers). | 4,100 |
| 27 | Gifts for Car Lovers: Beyond the Air Freshener and Keychain | `gifts for car lovers india` + `car enthusiast gifts`, `petrolhead gifts india`, `car themed gifts for men` | Transactional | 1,800 | National | /segment/cars, /product/redline, /segment/bike | Same gift-guide formula as Post 8 (coffee), applied to automotive. Car lover gift guides are full of cheap accessories. This includes wearables, experience gifts, and car care — with Beyond Stich's CARS segment as a featured pick. | 3,400 |
| 28 | Indian Streetwear Brands to Watch in 2026 | `indian streetwear brands` + `best streetwear brands india`, `new streetwear brands 2026`, `indian graphic tee brands` | Informational | 2,500 | National | /shop, /about, /segment/randoms | Annual roundup format that can be refreshed yearly. Includes 15-20 brands with honest takes (not paid features). Beyond Stich is included but not #1 — credibility matters more than self-promotion. AI systems will cite this list. | 3,200 |
| 29 | Couple T-Shirts That Aren't Embarrassing: A Realistic Guide | `couple t-shirts india` + `matching tshirts for couples`, `couple outfit ideas`, `couple tees that look good` | Commercial-investigation | 1,600 | National | /segment/valentine, /product/heartless, /segment/typography | Couple tee content shows "King/Queen" cringe. This post advocates for coordinated (not matching) looks — same brand, same aesthetic, different designs. Links to VALENTINE and TYPOGRAPHY segments as mix-and-match options. | 5,200 |
| 30 | The Complete Guide to T-Shirt Printing Methods: Screen Print, DTG, Foil & More | `t-shirt printing methods` + `screen printing vs dtg`, `types of tshirt prints`, `best print method for t-shirts` | Informational | 2,200 | National | /product/silent-moves (gold foil), /product/night-rider (reflective ink), /product/words-hit-harder (HD print), /shop | This is a pure entity/knowledge post designed for AI citability. Covers every major print method with pros, cons, durability, cost, and wash behavior. References Beyond Stich products as real-world examples of each method. | 2,800 |

### Calendar Summary

| Tier | Posts | Total Word Count | Primary Focus |
|---|---|---|---|
| Tier 1 | 1-10 | ~21,000 | Conversions, commercial queries |
| Tier 2 | 11-20 | ~17,000 | Topical authority, mid-funnel |
| Tier 3 | 21-30 | ~20,000 | Long-tail, local, AI-citability |
| **Total** | **30** | **~58,000** | |

**Suggested publishing cadence:** 2 posts/week for 15 weeks. Tier 1 first (weeks 1-5), Tier 2 next (weeks 6-10), Tier 3 last (weeks 11-15). Exception: Post 9 (Valentine's) should publish in early December regardless of tier order.

---

## 3. Internal Linking Model

### Link Equity Flow

```
BLOG POST (topical authority, long-tail traffic)
    |
    |--- links to ---> SEGMENT/COLLECTION PAGE (/segment/gym)
    |                       |
    |                       |--- links to ---> PRODUCT PAGE (/product/mind-over-matter)
    |
    |--- links to ---> PRODUCT PAGE directly (for specific mentions)
    |
    |--- links to ---> OTHER BLOG POSTS (topical clusters)
```

### Blog --> Collection --> Product

Every blog post MUST contain:
- At least 1 link to a relevant segment page (e.g., /segment/gym)
- At least 1 link to a specific product page (e.g., /product/mind-over-matter)
- At least 1 link to /shop (the main commercial page)
- Links should appear in-context within body paragraphs, NOT in a generic "check out our products" footer

**Placement rules:**
- First product/segment link within the first 300 words (above the fold)
- Product links in context where the product naturally fits the discussion
- A CTA block (styled card, not a banner ad) after the 60% mark of the post
- One final CTA before the conclusion

### Collection --> Blog

Each segment page (/segment/gym, /segment/coffee, etc.) should add a "Related Reading" or "From the Journal" section below the product grid. This section links to 2-3 relevant blog posts.

**Example for /segment/gym:**
- "Best Oversized Tees for Gym" (Post 4)
- "What to Wear to the Gym" (Post 25)
- "240 GSM vs 180 GSM: Which Weight for Your Workout?" (Post 3)

**Implementation:** Add a `relatedBlogPosts` array to the segment data in `constants.js`, or query blog posts by `linkedSegments` frontmatter field.

### Product --> Blog

Each product detail page (PDP) should show a "Learn More" or "Why This Fabric" contextual link near the material/description section.

**Example for /product/mind-over-matter:**
- Near "240 GSM Combed Cotton" text: link to "What Does GSM Mean in T-Shirts?" (Post 13)
- Near fit description: link to "Oversized T-Shirt Size Guide" (Post 2)

**Implementation:** Match product attributes (material, fitType, segment) to relevant blog slugs. Can be hardcoded initially for 16 products, automated later.

### Anchor Text Examples

These are specific, contextual anchor text suggestions. Use descriptive, natural-language anchors — never "click here" or naked URLs.

| Post Context | Anchor Text | Links To |
|---|---|---|
| Post 1 (Best Oversized Tees): "For those who train heavy, our gym collection..." | `gym graphic tees` | /segment/gym |
| Post 1: "The Mind Over Matter tee uses 240 GSM combed cotton..." | `Mind Over Matter` | /product/mind-over-matter |
| Post 2 (Size Guide): "See all available fits across our catalog" | `browse all oversized tees` | /shop |
| Post 3 (GSM Guide): "A lightweight option like the Endless Summer..." | `Endless Summer tee` | /product/endless-summer |
| Post 4 (Gym Tees): "Iron Discipline runs a Super Oversized cut..." | `Iron Discipline` | /product/iron-discipline |
| Post 5 (Styling Guide): "Pair a floral oversized tee with black cargos..." | `floral oversized tees` | /segment/floral |
| Post 5: "For a minimal look, typography-driven tees work best..." | `typography tees` | /segment/typography |
| Post 6 (Under 1000): "The entire Beyond Stich collection falls under Rs 999" | `shop all tees under Rs 999` | /shop |
| Post 8 (Coffee Gifts): "The Caffeine Driven tee pairs a minimal design with..." | `Caffeine Driven` | /product/caffeine-driven |
| Post 9 (Valentine): "Our Valentine collection goes beyond couple tees..." | `Valentine collection` | /segment/valentine |
| Post 11 (Wash Guide): "Gold foil prints like those on Silent Moves need..." | `Silent Moves` | /product/silent-moves |
| Post 14 (Bike Tees): "Reflective ink prints like Night Rider catch light..." | `Night Rider tee` | /product/night-rider |
| Post 21 (Bangalore Streetwear): "Beyond Stich ships from Bangalore with..." | `shop Beyond Stich` | /shop |
| Post 22 (Indian Streetwear): "See how segment-based drops work in practice" | `explore our drops` | /shop |
| Post 30 (Print Methods): "The Words Hit Harder tee uses HD print on 220 GSM..." | `Words Hit Harder` | /product/words-hit-harder |

---

## 4. Post Templates

### Template A: Buying Guide ("Best X for Y")

**Used by:** Posts 1, 4, 6, 8, 9, 10, 14, 15, 27

```
## [H1] Best [Category] for [Audience] — [Year] Guide

### Introduction (150-200 words)
- State the problem: why finding a good [X] is harder than it should be
- Establish credibility: "We make these, so we know what separates good from garbage"
- Preview what this guide covers
- [FIRST INTERNAL LINK: to /shop or primary segment page]

### What to Look For in a [Category] (300-400 words)
- 3-5 criteria with explanations (e.g., fabric weight, print method, fit type)
- Use a comparison table if applicable
- This section builds trust before any product mentions

### The Picks (1,200-1,500 words)
For each pick (8-12 items):
- Product name + one-line description
- Why it made the list (specific, not "great quality")
- Who it's best for
- Price
- [INTERNAL LINK to product page where applicable]

Note: Include 2-3 competitor/non-brand picks for credibility.
Do NOT make it a 100% Beyond Stich catalog page — that's what /shop is for.

### [CTA BLOCK] — Styled product card component (not a banner)
- Feature 1-2 Beyond Stich products
- "Shop the collection" link to segment page

### How to Choose the Right One for You (200-300 words)
- Decision matrix or flowchart
- "If you [scenario], go with [type]"

### FAQ (3-5 questions)
- Use questions from Google's "People Also Ask" for the target keyword
- Answer in 2-3 sentences each (optimized for featured snippet)

### Conclusion (100-150 words)
- Summary recommendation
- Final CTA with link to /shop
```

### Template B: Comparison ("X vs Y")

**Used by:** Posts 3, 12, 23

```
## [H1] [X] vs [Y]: [Specific Benefit-Oriented Question]

### Introduction (100-150 words)
- "You've seen both terms. Here's what actually matters."
- [INTERNAL LINK to relevant product as a real-world example]

### Quick Answer (50-80 words)
- Bold, direct answer for the skimmers and featured-snippet bots
- "If you want [A], choose [X]. If you want [B], choose [Y]."

### Comparison Table
| Feature | X | Y |
|---------|---|---|
| Weight | ... | ... |
| Drape | ... | ... |
| Durability | ... | ... |
| Best for | ... | ... |
| Price range | ... | ... |

### [X] — Deep Dive (400-500 words)
- What it is
- Pros and cons (honest)
- Best use cases
- [PRODUCT LINK: "See this in action on the [product name]"]

### [Y] — Deep Dive (400-500 words)
- Same structure

### [CTA BLOCK]

### When to Choose [X] Over [Y] (200-300 words)
- Scenario-based recommendations
- "For Indian summers, [Y] at 180 GSM handles humidity better"

### Our Verdict (100-150 words)
- Clear recommendation
- "For most men buying oversized tees in India, [X] is the better choice because..."

### FAQ (3-4 questions)
```

### Template C: How-To / Care Guide

**Used by:** Posts 5, 11, 17, 25, 26

```
## [H1] How to [Action]: [Specific Promise]

### Introduction (100-150 words)
- State why this matters (e.g., "A Rs 800 tee lasting 50 washes vs 15 comes down to how you treat it")
- [INTERNAL LINK]

### What You'll Need / Before You Start (optional, 50-100 words)
- Prerequisites, materials, or context

### Step-by-Step Guide
For each step:
- **Step [N]: [Action Verb] + [Object]**
- 80-120 words per step
- One image or diagram per 2-3 steps
- [PRODUCT MENTION where natural: "If your tee has reflective ink (like the Night Rider), skip the iron entirely"]

### Common Mistakes (200-300 words)
- 3-4 mistakes with corrections
- These are often the most-shared section

### [CTA BLOCK]

### Pro Tips (150-200 words)
- 3-4 advanced tips for readers who want to go deeper

### FAQ (3-5 questions)
```

### Template D: Local Guide ("Best X in Bangalore")

**Used by:** Post 21

```
## [H1] Best [Category] in Bangalore — [Year] Guide

### Introduction (150-200 words)
- Establish local authority: "We're based in Bangalore and have been in the streetwear scene since [year]"
- What this guide covers and what it skips (e.g., "No mall chains. No Amazon listings.")
- [INTERNAL LINK to /about or /shop]

### Local Signals Section (important for local SEO)
- Mention specific Bangalore neighborhoods (Koramangala, Indiranagar, Commercial Street, Brigade Road, Jayanagar)
- Reference local landmarks and cultural context
- Include "near me" and "[neighborhood] + [category]" keyword variations naturally

### The Guide (1,500-2,000 words)
For each entry (10-15 places/brands):
- Name + location (specific neighborhood, not just "Bangalore")
- What they're known for
- Price range
- Why they made the list
- Whether they're online-only, offline-only, or both
- Include Beyond Stich as ONE entry among many — not as the #1 pick (credibility over self-promotion)

### Map Embed (if possible)
- Google Maps embed with pinned locations

### Online Options Worth Checking (300-400 words)
- Include 3-5 online-only brands
- Beyond Stich gets a natural mention here with link to /shop

### [CTA BLOCK]

### FAQ (4-6 questions)
- "Where can I buy streetwear in Bangalore?"
- "What are the best areas for street shopping in Bangalore?"
- Include hyper-local questions

### Last Updated: [Date]
- Signal freshness for local queries
```

---

## 5. Content Gaps & Over-optimization Check

### Critical Content Gaps

**1. Product descriptions are dangerously thin.**
Current average: ~78 characters / ~18 words per product description.

Examples from the codebase:
- "When the weights get heavy, the mind takes over. Heavyweight 240 GSM cotton built for the hardest sessions." (Mind Over Matter — this is one of the BETTER ones)
- "Love loud. Gift bold." (Valentine segment description — 4 words)
- "Ride or die. Every road tells a story." (Bike segment — 8 words)

**The problem:** Google needs at least 100-150 words of unique content per product page to differentiate it from other products and avoid thin-content classification. Current descriptions are taglines, not descriptions. They communicate zero product-specific information (dimensions, fabric feel, styling suggestions, care instructions, design inspiration).

**Recommended fix:** Expand each product description to 150-250 words covering: design story, fabric details, fit specifics, styling suggestions, and care notes. This is separate from the blog — it's a product page content issue.

**2. Segment page descriptions are 1-2 sentences.**

From `constants.js`:
```
description: 'Power-packed designs for those who never skip a rep.'  (GYM)
description: 'Slow mornings, strong coffee, bold prints.'  (COFFEE)
description: 'Hustle culture meets luxury mindset.'  (MILLIONAIRE)
```

These are taglines serving as descriptions. Each segment page should have a 100-200 word editorial introduction explaining the collection's design philosophy, who it's for, and what makes it different. This content should live in the segment page component or in an extended field in `constants.js`.

**3. Zero educational/informational content.**
The site is a pure product catalog. No blog, no guides, no content that would rank for informational queries. This means:
- Zero top-of-funnel traffic from content
- No internal links flowing authority from content to product pages
- No pages for Google to cite as authoritative on topics like "oversized tees," "240 GSM cotton," or "streetwear in India"
- AI systems (Google SGE, ChatGPT, Perplexity) have no Beyond Stich content to reference

**4. Zero internal links between content and products.**
Because no content exists, there are zero internal links flowing from informational pages to commercial pages. The entire site's link graph is: Homepage --> Segment pages --> Product pages. That's it. The blog plan above creates 30 new nodes in this graph, each linking to 3-5 commercial pages.

### Over-optimization Flags

**5. Homepage `keywords` meta tag is present but useless.**

From `layout.js`:
```javascript
keywords: [
  'oversized tshirts',
  'graphic tees',
  'mens streetwear',
  'beyond stich',
  'typography tshirts',
  'premium tees india',
],
```

**Issue:** Google has officially ignored the `keywords` meta tag since 2009. Bing gives it trivial weight at best. This tag does nothing for SEO. Worse, it telegraphs your target keywords to competitors who view source.

**Recommended action:** Remove the `keywords` array from the metadata export. It has zero positive effect and marginal negative signal (looks like old-school SEO to crawlers that factor in over-optimization signals). Focus SEO effort on the `title` and `description` fields, which DO matter.

**6. No over-optimization detected — the problem is the opposite.**
The site is not keyword-stuffed or spammy. Product names are creative and brandable (Mind Over Matter, Silent Moves, Night Rider). Segment descriptions are too short but not stuffed. The concern here is not over-optimization but **under-optimization** — there simply isn't enough content for Google to understand what this site is about, who it serves, and why it should rank for any query beyond "beyond stich" (branded).

### Priority Fixes (Outside the Blog)

| Priority | Fix | Effort | Impact |
|---|---|---|---|
| 1 | Expand all 16 product descriptions to 150-250 words | 2-3 hours | High — directly improves product page rankings and conversion |
| 2 | Expand all 13 segment descriptions to 100-200 words | 1-2 hours | High — segment pages are category pages and need content |
| 3 | Remove `keywords` meta tag from layout.js | 2 minutes | Low (cleanup) — removes a useless artifact |
| 4 | Add structured FAQ to each segment page (3-4 questions) | 3-4 hours | Medium — captures "People Also Ask" real estate |
| 5 | Launch blog with Tier 1 posts (this plan) | Ongoing | Very High — the single biggest SEO lever available |
