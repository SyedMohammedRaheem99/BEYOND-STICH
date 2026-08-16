import { BRAND } from '@/lib/constants';

export default function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url: BRAND.url,
    logo: `${BRAND.url}/logos/beyond-stich-logo.png`,
    description: BRAND.description,
    contactPoint: {
      '@type': 'ContactPoint',
      email: BRAND.email,
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
    // Only profiles that actually exist. Instagram is the one the footer
    // links; Facebook/YouTube/Pinterest were asserted here but appear
    // nowhere else in the site, and sameAs entries that 404 weaken entity
    // resolution rather than help it. Add them back once they're live.
    sameAs: ['https://instagram.com/beyondstich'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
