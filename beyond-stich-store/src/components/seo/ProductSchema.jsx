export default function ProductSchema({ product }) {
  if (!product) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beyondstich.com';

  // Rolling 90-day priceValidUntil so it never goes stale.
  // Anchored to the product's own timestamp rather than Date.now(): calling
  // an impure function during render makes the markup differ between the
  // server and client passes, which React flags and which can produce a
  // hydration mismatch in this <script> tag.
  // Falls back to a fixed far-future date rather than epoch when a product
  // carries no timestamp — `new Date(0)` would emit priceValidUntil=1970 and
  // invalidate the offer in Google's structured-data parser.
  const priceAnchor = product.updatedAt || product.createdAt;
  const parsedAnchor = priceAnchor ? new Date(priceAnchor) : null;
  const priceValidUntil =
    parsedAnchor && !Number.isNaN(parsedAnchor.getTime())
      ? new Date(parsedAnchor.getTime() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      : '2099-12-31';

  // Specs are operator-defined label/value rows, so match on the label to
  // map the handful schema.org has dedicated properties for. Anything else
  // still ships as additionalProperty, which Google reads for the
  // product-details enrichment.
  const specByLabel = (re) =>
    (product.specs || []).find((s) => re.test(String(s.label || '')))?.value;

  const material = product.material || specByLabel(/fabric|material/i);
  const pattern = specByLabel(/pattern/i);
  const color = product.colors?.length === 1 ? product.colors[0] : undefined;

  const additionalProperty = (product.specs || [])
    .filter((s) => s.label && s.value)
    .map((s) => ({
      '@type': 'PropertyValue',
      name: s.label,
      value: s.value,
    }));

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    url: `${baseUrl}/product/${product.slug}`,
    image: product.images || [],
    // Prefer the short description: it is written to stand alone, where
    // the long one opens mid-thought.
    description:
      product.shortDescription || product.description || `Buy ${product.name} at Beyond Stich.`,
    sku: product.slug,
    mpn: product._id ? product._id.toString() : product.slug,
    ...(product.productType ? { category: product.productType } : {}),
    ...(material ? { material } : {}),
    ...(pattern ? { pattern } : {}),
    ...(color ? { color } : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
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
