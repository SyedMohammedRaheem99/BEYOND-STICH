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
    sameAs: [
      'https://instagram.com/beyondstich',
      'https://www.facebook.com/beyondstich',
      'https://youtube.com/@beyondstich',
      'https://pinterest.com/beyondstich',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
