export default function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'Beyond Stich',
    url: 'https://beyondstich.com',
    logo: 'https://beyondstich.com/logos/beyond-stich-logo.png',
    image: 'https://beyondstich.com/banners/og/og-default.jpg',
    description:
      'Beyond Stich — premium oversized graphic tees for men. 240 GSM combed cotton, bold typography, 13+ segment worlds. Based in Bangalore, India.',
    priceRange: '₹799 – ₹999',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Net Banking, COD',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 12.9716,
      longitude: 77.5946,
    },
    email: 'hello@beyondstich.com',
    telephone: '+91-83102-73670',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '19:00',
      },
    ],
    sameAs: [
      'https://instagram.com/beyondstich',
    ],
    hasMap: 'https://maps.google.com/?q=Bangalore,Karnataka,India',
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
