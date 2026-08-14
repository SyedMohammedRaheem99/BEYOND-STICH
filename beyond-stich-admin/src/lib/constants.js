// ============================================
// BEYOND STICH — Constants & Segment Config
// ============================================

export const BRAND = {
  name: 'Beyond Stich',
  tagline: 'Wear the thought.',
  description: 'Premium oversized graphic tees for men who think different.',
  url: 'https://beyondstich.com',
  email: 'hello@beyondstich.com',
};

export const SEGMENTS = [
  {
    id: 'gym',
    name: 'GYM',
    tagline: 'Grind never stops.',
    accent: '#F5C518',
    description: 'Power-packed designs for those who never skip a rep.',
  },
  {
    id: 'coffee',
    name: 'COFFEE',
    tagline: 'Brew your vibe.',
    accent: '#D4793E',
    description: 'Slow mornings, strong coffee, bold prints.',
  },
  {
    id: 'millionaire',
    name: 'MILLIONAIRE',
    tagline: 'Success is the only option.',
    accent: '#D4AF37',
    description: 'Hustle culture meets luxury mindset.',
  },
  {
    id: 'music',
    name: 'MUSIC',
    tagline: 'Feel the frequency.',
    accent: '#9B5DE5',
    description: 'Melodies you can wear. Rhythm you can feel.',
  },
  {
    id: 'gamer',
    name: 'GAMER',
    tagline: 'Press start.',
    accent: '#00FF94',
    description: 'Level up your wardrobe. No respawns needed.',
  },
  {
    id: 'cars',
    name: 'CARS',
    tagline: 'Built for speed.',
    accent: '#EF5350',
    description: 'Horsepower on your chest. Speed in your DNA.',
  },
  {
    id: 'bike',
    name: 'BIKE',
    tagline: 'Two wheels, one soul.',
    accent: '#FF6B35',
    description: 'Ride or die. Every road tells a story.',
  },
  {
    id: 'summer',
    name: 'SUMMER',
    tagline: 'Chase the sun.',
    accent: '#06B6D4',
    description: 'Beach vibes, coastal energy, endless summer.',
  },
  {
    id: 'floral',
    name: 'FLORAL',
    tagline: 'Bloom different.',
    accent: '#EC4899',
    description: 'Bold florals for bold men. Not your usual.',
  },
  {
    id: 'sports',
    name: 'SPORTS',
    tagline: 'Game on.',
    accent: '#3B82F6',
    description: 'From the field to the street. Always in the game.',
  },
  {
    id: 'valentine',
    name: 'VALENTINE',
    tagline: 'Wear your heart.',
    accent: '#EF4444',
    description: 'Love loud. Gift bold.',
  },
  {
    id: 'typography',
    name: 'TYPOGRAPHY',
    tagline: 'Words hit harder.',
    accent: '#F8F8F8',
    description: 'Pure text. Pure impact. Nothing else needed.',
  },
  {
    id: 'randoms',
    name: 'RANDOMS',
    tagline: 'Expect the unexpected.',
    accent: '#94A3B8',
    description: 'Designs that don\'t fit a box. And that\'s the point.',
  },
];

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const FIT_TYPES = ['Oversized', 'Super Oversized'];

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export function getSegmentByName(name) {
  return SEGMENTS.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
}

export function getSegmentAccent(segmentName) {
  const segment = getSegmentByName(segmentName);
  return segment ? segment.accent : '#F8F8F8';
}
