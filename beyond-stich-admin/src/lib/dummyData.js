import { SEGMENTS } from './constants';

export const DUMMY_PRODUCTS = [
  {
    _id: 'p1',
    name: 'MIND OVER MATTER',
    slug: 'mind-over-matter',
    segment: 'GYM',
    price: 799,
    mrp: 1299,
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80'
    ],
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 12 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 0 },
      { size: 'XXL', stock: 8 }
    ],
    colors: ['Black'],
    description: 'When the weights get heavy, the mind takes over. Heavyweight 240 GSM cotton built for the hardest sessions.',
    fitType: 'Oversized',
    tags: ['new', 'trending'],
    averageRating: 4.8,
    reviewCount: 42,
  },
  {
    _id: 'p2',
    name: 'CAFFEINE DRIVEN',
    slug: 'caffeine-driven',
    segment: 'COFFEE',
    price: 899,
    mrp: 1499,
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'
    ],
    sizes: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 2 },
      { size: 'XXL', stock: 0 }
    ],
    colors: ['White', 'Mocha'],
    description: 'Fuel for the thinkers and the creators. A minimal drop for those who start their day right.',
    fitType: 'Oversized',
    tags: [],
    averageRating: 4.5,
    reviewCount: 18,
  },
  {
    _id: 'p3',
    name: 'SILENT MOVES',
    slug: 'silent-moves',
    segment: 'MILLINIORE',
    price: 999,
    mrp: 1599,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80'
    ],
    sizes: [
      { size: 'S', stock: 0 },
      { size: 'M', stock: 3 },
      { size: 'L', stock: 7 },
      { size: 'XL', stock: 10 },
      { size: 'XXL', stock: 5 }
    ],
    colors: ['Black'],
    description: 'Hustle in silence, let the success make the noise. Gold accent prints on premium dark cotton.',
    fitType: 'Super Oversized',
    tags: ['premium'],
    averageRating: 5.0,
    reviewCount: 9,
  },
  {
    _id: 'p4',
    name: 'NIGHT RIDER',
    slug: 'night-rider',
    segment: 'BIKE',
    price: 799,
    mrp: 1299,
    images: [
      'https://images.unsplash.com/photo-1572495532056-3245c38ebbe4?w=800&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80'
    ],
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
      { size: 'XXL', stock: 5 }
    ],
    colors: ['Black', 'Grey'],
    description: 'Built for the wind. Subtle reflective prints that catch the streetlights.',
    fitType: 'Oversized',
    tags: [],
    averageRating: 4.2,
    reviewCount: 31,
  },
  {
    _id: 'p5',
    name: 'SYNTH WAVE',
    slug: 'synth-wave',
    segment: 'MUSIC',
    price: 849,
    mrp: 1399,
    images: [
      'https://images.unsplash.com/photo-1512327428889-607eeb19efe8?w=800&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'
    ],
    sizes: [
      { size: 'M', stock: 12 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 8 },
    ],
    colors: ['Black'],
    description: 'Feel the 80s frequency. Neon aesthetic meant for the midnight drives.',
    fitType: 'Oversized',
    tags: ['trending'],
    averageRating: 4.9,
    reviewCount: 56,
  },
  {
    _id: 'p6',
    name: 'NO RESPAWNS',
    slug: 'no-respawns',
    segment: 'GAMER',
    price: 899,
    mrp: 1499,
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
      'https://images.unsplash.com/photo-1572495532056-3245c38ebbe4?w=800&q=80'
    ],
    sizes: [
      { size: 'S', stock: 15 },
      { size: 'M', stock: 25 },
      { size: 'L', stock: 20 },
      { size: 'XL', stock: 10 },
      { size: 'XXL', stock: 5 }
    ],
    colors: ['Black', 'Green'],
    description: 'One life. Play it well. Featuring breathable cotton for those long sessions.',
    fitType: 'Super Oversized',
    tags: [],
    averageRating: 4.7,
    reviewCount: 112,
  },
];
