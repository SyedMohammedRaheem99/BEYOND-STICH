// ============================================
// BEYOND STICH — Banner Configurations
// ============================================

// --- Hero Carousel Slides ---
// Each slide has a genuinely different desktop and mobile crop (landscape vs
// portrait), so the art direction in HeroSection actually does something —
// previously both keys pointed at the same file and phones were served the
// desktop framing. Copy is written to match what is actually pictured.
export const HERO_SLIDES = [
  {
    id: 'be-a-voice',
    desktop: '/banners/hero/home-3-desktop.webp',
    mobile: '/banners/hero/home-3-mobile.webp',
    badge: 'NEW DROP',
    headline: 'BE A VOICE\nNOT AN ECHO',
    subheadline: 'Statement graphics on 240 GSM heavyweight cotton. Oversized fit.',
    cta: { label: 'SHOP THE DROP', href: '/shop' },
    theme: 'dark',
  },
  {
    id: 'explorer',
    desktop: '/banners/hero/home-1-desktop.webp',
    mobile: '/banners/hero/home-1-mobile.webp',
    badge: 'JUST LANDED',
    headline: 'EXPLORER',
    subheadline: 'High-density prints that hold their colour, wash after wash.',
    cta: { label: 'SEE THE DROP', href: '/shop' },
    theme: 'dark',
  },
  {
    id: 'full-collection',
    desktop: '/banners/hero/home-2-desktop.webp',
    mobile: '/banners/hero/home-2-mobile.webp',
    badge: '13 SEGMENT WORLDS',
    headline: 'FIND YOUR\nWORLD',
    subheadline: 'Gym, gaming, coffee, music and more — a tee for whatever you live in.',
    cta: { label: 'EXPLORE WORLDS', href: '/shop' },
    theme: 'dark',
  },
  {
    id: 'welcome-offer',
    desktop: '/banners/hero/home-4-desktop.webp',
    mobile: '/banners/hero/home-4-mobile.webp',
    badge: 'EXCLUSIVE OFFER',
    headline: 'FLAT 20%\nOFF YOUR\nFIRST ORDER',
    subheadline: 'Welcome to Beyond Stich. No minimum order value.',
    cta: { label: 'CLAIM OFFER', href: '/shop' },
    code: 'WELCOME20',
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

// Legacy single hero export (for backward compat if needed)
export const HERO = HERO_SLIDES[0];

// --- Offer / Promo Banners ---
export const PROMOS = [
  {
    id: 'first-order',
    headline: 'FLAT 20% OFF',
    subheadline: 'YOUR FIRST ORDER',
    description: 'No minimum order value. Apply at checkout.',
    code: 'WELCOME20',
    cta: { label: 'SHOP NOW', href: '/shop' },
    accent: '#F5C518',
    icon: 'percent',
  },
  {
    id: 'free-shipping',
    headline: 'FREE SHIPPING',
    subheadline: 'ON ORDERS OVER ₹999',
    description: 'Fast delivery across India. No hidden charges.',
    cta: { label: 'SHOP NOW', href: '/shop' },
    accent: '#06B6D4',
    icon: 'truck',
  },
  {
    id: 'bundle-deal',
    headline: 'BUY 2 GET',
    subheadline: '10% OFF',
    description: 'Mix & match across any segment world.',
    code: 'BUNDLE10',
    cta: { label: 'BUILD YOUR SET', href: '/shop' },
    accent: '#9B5DE5',
    icon: 'stack',
  },
];

// Legacy single offer export (backward compat)
export const OFFER = {
  desktop: '/banners/offers/first-order-desktop.png',
  mobile: '/banners/offers/first-order-mobile.png',
  eyebrow: 'FIRST DROP OFFER',
  headline: 'FLAT 20% OFF\nYOUR FIRST ORDER',
  code: 'WELCOME20',
  cta: { label: 'SHOP THE DROP', href: '/shop' },
};

// --- Shop Page Banners ---
export const SHOP_BANNERS = [
  {
    id: 'new-this-week',
    headline: 'NEW THIS WEEK',
    subheadline: 'Fresh drops just landed. Be the first to cop.',
    cta: { label: 'SHOP NEW', href: '/shop' },
    accent: '#F5C518',
  },
  {
    id: 'starting-price',
    headline: 'TEES STARTING AT ₹799',
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
