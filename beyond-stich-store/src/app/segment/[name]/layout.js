import { BRAND, SEGMENT_IMAGES } from '@/lib/constants';
import { getSegment } from '@/lib/segments';

export async function generateMetadata({ params }) {
  const { name } = await params;

  const segment = await getSegment(name);

  if (!segment) {
    return { title: `Collection Not Found | ${BRAND.name}` };
  }

  const title = `${segment.name} Collection | ${BRAND.name}`;
  const description = `${segment.description} Shop the ${segment.name} collection at ${BRAND.name}. ${BRAND.description}`;
  const image = SEGMENT_IMAGES[segment.name] || '/banners/og/og-default.jpg';

  const canonical = `${BRAND.url}/segment/${segment.slug || segment.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: BRAND.name,
      images: [{ url: image, width: 1200, height: 630, alt: `${segment.name} Collection` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function SegmentLayout({ children }) {
  return children;
}
