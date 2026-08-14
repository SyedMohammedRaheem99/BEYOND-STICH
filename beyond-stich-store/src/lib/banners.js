// ============================================
// BEYOND STICH — Banner Configurations
// ============================================

// --- Hero Carousel Slides ---
export const HERO_SLIDES = [
  {
    id: 'new-drop',
    desktop: '/banners/hero/slide-new-drop.png',
    mobile: '/banners/hero/slide-new-drop.png',
    badge: 'NEW DROP',
    headline: 'THE NEW\nCOLLECTION\nIS LIVE',
    subheadline: 'Premium oversized graphic tees. 240 GSM heavyweight cotton.',
    cta: { label: 'SHOP THE DROP', href: '/shop' },
  },
  {
    id: 'sale',
    desktop: '/banners/hero/slide-sale.png',
    mobile: '/banners/hero/slide-sale.png',
    badge: 'SALE',
    headline: 'END OF\nSEASON\nSALE',
    subheadline: 'Up to 40% off on selected styles. Limited time only.',
    cta: { label: 'SHOP SALE', href: '/shop' },
  },
  {
    id: 'urban',
    desktop: '/banners/hero/slide-urban.png',
    mobile: '/banners/hero/slide-urban.png',
    badge: 'STREET STYLE',
    headline: 'WEAR THE\nTHOUGHT',
    subheadline: 'Oversized fits designed for the streets. Built to turn heads.',
    cta: { label: 'EXPLORE NOW', href: '/shop' },
  },
  {
    id: 'first-order',
    desktop: '/banners/hero/slide-first-order.png',
    mobile: '/banners/hero/slide-first-order.png',
    badge: 'EXCLUSIVE OFFER',
    headline: 'FLAT 10%\nOFF YOUR\nFIRST ORDER',
    subheadline: 'Use code BEYOND10 at checkout. No minimum order value.',
    cta: { label: 'CLAIM OFFER', href: '/shop' },
    code: 'BEYOND10',
  },
];

// Legacy single hero export (for backward compat if needed)
export const HERO = HERO_SLIDES[0];

// --- Offer / Promo Banners ---
export const PROMOS = [
  {
    id: 'first-order',
    headline: 'FLAT 10% OFF',
    subheadline: 'YOUR FIRST ORDER',
    description: 'No minimum order value. Apply at checkout.',
    code: 'BEYOND10',
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
  headline: 'FLAT 10% OFF\nYOUR FIRST ORDER',
  code: 'BEYOND10',
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
