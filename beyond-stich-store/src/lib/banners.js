// ============================================
// BEYOND STICH — Banner Configurations
// ============================================

// --- Hero Carousel Slides ---
// Each slide has a genuinely different desktop and mobile crop (landscape vs
// portrait), so the art direction in HeroSection actually does something —
// previously both keys pointed at the same file and phones were served the
// desktop framing. Copy is written to match what is actually pictured.
// Copy rule: every slide leads with a reason to act — an offer, a price, or
// risk-reversal — not a spec sheet. Specs support a decision; they don't
// create one. Any code shown here MUST exist in the database (see WELCOME
// codes below), or the customer hits "Invalid coupon code" at checkout.
export const HERO_SLIDES = [
  {
    id: 'welcome-offer',
    desktop: '/banners/hero/home-4-desktop.webp',
    mobile: '/banners/hero/home-4-mobile.webp',
    badge: 'FIRST ORDER OFFER',
    headline: 'UP TO 25%\nOFF YOUR\nFIRST ORDER',
    subheadline:
      '10% off above ₹949 · 25% off above ₹1999. Free shipping over ₹999, Cash on Delivery, 7-day returns.',
    cta: { label: 'CLAIM YOUR DISCOUNT', href: '/shop' },
    code: 'WELCOME25',
    theme: 'dark',
  },
  {
    id: 'be-a-voice',
    desktop: '/banners/hero/home-3-desktop.webp',
    mobile: '/banners/hero/home-3-mobile.webp',
    badge: 'NEW DROP',
    headline: 'BE A VOICE\nNOT AN ECHO',
    subheadline: 'Heavyweight 240 GSM oversized tees from ₹949. Cash on Delivery available.',
    cta: { label: 'SHOP FROM ₹949', href: '/shop' },
    theme: 'dark',
  },
  {
    id: 'full-collection',
    desktop: '/banners/hero/home-2-desktop.webp',
    mobile: '/banners/hero/home-2-mobile.webp',
    badge: 'BUY 2, SAVE MORE',
    headline: 'PICK 2.\nGET 25% OFF.',
    subheadline:
      'Two tees clear ₹1999 — that unlocks the biggest welcome discount. 13 worlds to choose from.',
    cta: { label: 'BUILD YOUR SET', href: '/shop' },
    theme: 'dark',
  },
  {
    id: 'explorer',
    desktop: '/banners/hero/home-1-desktop.webp',
    mobile: '/banners/hero/home-1-mobile.webp',
    badge: 'JUST LANDED',
    headline: 'THE EXPLORER\nTEE',
    subheadline: 'Prints that survive the wash, not just the photo. Try it — 7-day free returns.',
    cta: { label: 'SHOP THE DROP', href: '/shop' },
    theme: 'dark',
  },
];

// --- All Drops (/shop) hero slides ---
export const SHOP_HERO_SLIDES = [
  {
    id: 'the-collection',
    desktop: '/banners/shop/drops-1-desktop.webp',
    mobile: '/banners/shop/drops-1-mobile.webp',
    headline: 'ALL DROPS',
    subheadline: 'Every tee we make, in one place. 240 GSM combed cotton, oversized fit.',
  },
  {
    id: 'built-heavy',
    desktop: '/banners/shop/drops-2-desktop.webp',
    mobile: '/banners/shop/drops-2-mobile.webp',
    headline: 'BUILT HEAVY',
    subheadline: 'Structured drop-shoulder cuts that hold their shape.',
  },
  {
    id: 'wear-the-thought',
    desktop: '/banners/shop/drops-3-desktop.webp',
    mobile: '/banners/shop/drops-3-mobile.webp',
    headline: 'WEAR THE THOUGHT',
    subheadline: 'Designed in Bangalore. Made for everywhere.',
  },
];

// The legacy HERO and OFFER exports were removed: nothing imported them, and
// OFFER still advertised WELCOME20 (a code that never existed) alongside
// image paths that had already been deleted.

// --- Offer / Promo Banners ---
export const PROMOS = [
  {
    id: 'first-order',
    headline: '25% OFF',
    subheadline: 'YOUR FIRST ORDER OVER ₹1999',
    description: 'New here? Two tees unlock the biggest welcome discount.',
    code: 'WELCOME25',
    cta: { label: 'SHOP NOW', href: '/shop' },
    accent: '#F5C518',
    icon: 'percent',
  },
  {
    id: 'free-shipping',
    headline: 'FREE SHIPPING',
    subheadline: 'ON ORDERS OVER ₹999',
    description: 'Delivered across India. Cash on Delivery available.',
    cta: { label: 'SHOP NOW', href: '/shop' },
    accent: '#06B6D4',
    icon: 'truck',
  },
  {
    id: 'easy-returns',
    headline: '7-DAY RETURNS',
    subheadline: 'WRONG SIZE? SEND IT BACK',
    description: 'Try it on at home. If the fit is off, we will sort it out.',
    cta: { label: 'READ THE POLICY', href: '/returns' },
    accent: '#9B5DE5',
    icon: 'stack',
  },
];

// --- Shop Page Banners ---
export const SHOP_BANNERS = [
  {
    // "NEW THIS WEEK" was a standing claim with nothing behind it — the
    // banner said it every week regardless of whether anything had dropped.
    id: 'new-this-week',
    headline: 'FIRST ORDER? SAVE 25%',
    subheadline: '10% off above ₹949, 25% off above ₹1999. Applied at checkout.',
    cta: { label: 'SHOP NOW', href: '/shop' },
    accent: '#F5C518',
  },
  {
    id: 'starting-price',
    headline: 'TEES STARTING AT ₹949',
    subheadline: 'Premium 240 GSM oversized tees at unbeatable prices.',
    cta: { label: 'SHOP ALL', href: '/shop' },
    accent: '#06B6D4',
  },
  {
    id: 'free-shipping',
    headline: 'FREE SHIPPING ON ₹999+',
    subheadline: 'No hidden charges. Fast delivery across India.',
    cta: { label: 'SHOP NOW', href: '/shop' },
    accent: '#EC4899',
  },
];
