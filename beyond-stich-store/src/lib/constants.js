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
    accent: '#C4622D',
    description: 'Slow mornings, strong coffee, bold prints.',
  },
  {
    id: 'milliniore',
    name: 'MILLINIORE',
    tagline: 'Success is the only option.',
    accent: '#D4AF37',
    description: 'Hustle culture meets luxury mindset.',
  },
  {
    id: 'music',
    name: 'MUSIC',
    tagline: 'Feel the frequency.',
    accent: '#7C3AED',
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
    accent: '#E63946',
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

// Named colors → hex, for rendering swatches on cards/PDP.
export const COLOR_HEX = {
  Black: '#111111',
  White: '#F5F5F5',
  Grey: '#9CA3AF',
  Charcoal: '#374151',
  Mocha: '#8B5E3C',
  Cream: '#F5EAD8',
  Sand: '#D9C7A0',
  'Off-White': '#EDE8E0',
  Navy: '#1E3A5F',
  Green: '#16A34A',
  Red: '#E63946',
};

export function getColorHex(name) {
  return COLOR_HEX[name] || '#888888';
}

// Cinematic key image per segment world (used by the home grid + segment hero).
export const SEGMENT_IMAGES = {
  GYM: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
  COFFEE: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=1200&q=80',
  MILLINIORE: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=1200&q=80',
  MUSIC: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&q=80',
  GAMER: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
  CARS: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80',
  BIKE: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=1200&q=80',
  SUMMER: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  FLORAL: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=1200&q=80',
  SPORTS: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
  VALENTINE: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&q=80',
  TYPOGRAPHY: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=1200&q=80',
  RANDOMS: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
};

export function getSegmentImage(name) {
  return SEGMENT_IMAGES[name] || SEGMENT_IMAGES.RANDOMS;
}

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
