// ============================================
// BEYOND STICH — Banner Configurations
// ============================================

// --- Hero Carousel Slides ---
export const HERO_SLIDES = [
  {
    id: 'mens-typography',
    desktop: '/banners/hero/slide-mens-typography.png',
    mobile: '/banners/hero/slide-mens-typography.png',
    badge: 'NEW DROP',
    headline: 'WEAR THE\nTHOUGHT',
    subheadline: 'Be Strong. Be A Voice. 240 GSM Premium Oversized Tees.',
    cta: { label: 'SHOP THE DROP', href: '/shop' },
    theme: 'dark',
  },
  {
    id: 'welcome-offer',
    desktop: '/banners/hero/slide-welcome-offer.png',
    mobile: '/banners/hero/slide-welcome-offer.png',
    badge: 'EXCLUSIVE OFFER',
    headline: 'FLAT 20%\nOFF YOUR\nFIRST ORDER',
    subheadline: 'Welcome to Beyond Stich. No minimum order value.',
    cta: { label: 'CLAIM OFFER', href: '/shop' },
    code: 'WELCOME20',
    theme: 'dark',
  },
  {
    id: 'gamer',
    desktop: '/banners/hero/slide-gamer.png',
    mobile: '/banners/hero/slide-gamer.png',
    badge: 'GAMER COLLECTION',
    headline: 'GAME ON.\nDRESS UP.',
    subheadline: 'Error 404. Games Over. Level unlocked — in premium oversized fits.',
    cta: { label: 'SHOP GAMER', href: '/shop' },
    theme: 'dark',
  },
  {
    id: 'floral-women',
    desktop: '/banners/hero/slide-floral-women.png',
    mobile: '/banners/hero/slide-floral-women.png',
    badge: "WOMEN'S EDIT",
    headline: 'BLOOM IN\nYOUR OWN\nSTYLE',
    subheadline: 'Floral heavyweight tees. Feminine. Bold. Premium.',
    cta: { label: 'SHOP WOMEN', href: '/shop' },
    theme: 'light',
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
