/**
 * Organisation schema for the store.
 *
 * Deliberately NOT a ClothingStore/LocalBusiness. That type declares a
 * physical shop customers can visit, and it previously carried opening hours
 * (Mon–Sat 10:00–19:00), a hasMap link, and geo coordinates that were just
 * the centroid of Bangalore — for a business with no storefront. Asserting a
 * location and hours nobody is there to honour is a structured-data policy
 * violation and risks a manual action.
 *
 * OnlineStore keeps the parts that are true: the brand, the real contact
 * details, the price range, and the area actually served.
 */
export default function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'Beyond Stich',
    url: 'https://beyondstich.com',
    logo: 'https://beyondstich.com/logos/beyond-stich-logo.png',
    image: 'https://beyondstich.com/banners/og/og-default.jpg',
    description:
      'Beyond Stich — premium oversized graphic tees for men. 240 GSM combed cotton, bold typography, 13+ segment worlds. Based in Bangalore, India.',
    priceRange: '₹799 – ₹999',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash on Delivery, UPI, Credit Card, Debit Card, Net Banking',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
    email: 'hello@beyondstich.com',
    telephone: '+91-83102-73670',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+91-83102-73670',
      email: 'hello@beyondstich.com',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi', 'Kannada'],
    },
    sameAs: ['https://instagram.com/beyondstich'],
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
