export default function ProductSchema({ product }) {
  if (!product) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beyondstich.com';

  // Rolling 90-day priceValidUntil so it never goes stale
  const priceValidUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    url: `${baseUrl}/product/${product.slug}`,
    image: product.images || [],
    description: product.description || `Buy ${product.name} at Beyond Stich.`,
    sku: product.slug,
    mpn: product._id ? product._id.toString() : product.slug,
    brand: {
      '@type': 'Brand',
      name: 'Beyond Stich',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil,
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.sizes && product.sizes.some((s) => s.stock > 0)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Beyond Stich',
      },
    },
    ...(product.averageRating > 0 && product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
