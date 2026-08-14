import HeroSection from '@/components/home/HeroSection';
import TrustBar from '@/components/home/TrustBar';
import SegmentGrid from '@/components/home/SegmentGrid';
import LatestDrop from '@/components/home/LatestDrop';
import OfferBanner from '@/components/home/OfferBanner';
import BrandManifesto from '@/components/home/BrandManifesto';
import SocialProofBar from '@/components/home/SocialProofBar';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { DUMMY_PRODUCTS } from '@/lib/dummyData';
import { getSegmentAccent } from '@/lib/constants';

// Serve catalog pages from cache for 5 minutes. Without this every
// visit blocks on a MongoDB round trip before any HTML ships.
export const revalidate = 300;

export const metadata = {
  title: 'Beyond Stich | Wear the thought.',
  description: 'Premium oversized graphic tees for men. GYM, COFFEE, MUSIC, GAMER & more.',
};

async function getLatestDrops() {
  let products = [];
  try {
    await connectDB();
    const docs = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(6).lean();
    if (docs.length > 0) products = docs.map(d => ({ ...d, _id: d._id.toString() }));
  } catch {}
  if (products.length === 0) products = DUMMY_PRODUCTS.slice(0, 6);
  return products.map(p => ({
    id: p._id,
    slug: p.slug,
    name: p.name,
    segment: p.segment,
    image: p.images?.[0],
    color: getSegmentAccent(p.segment),
    price: p.price,
    mrp: p.mrp,
  }));
}

export default async function Home() {
  const latestDrops = await getLatestDrops();

  return (
    <>
      <h1 style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}>
        Beyond Stich — Premium Oversized Graphic Tees for Men | Bangalore, India
      </h1>
      <HeroSection />
      <TrustBar />
      <LatestDrop initialDrops={latestDrops} />
      <SegmentGrid />
      <OfferBanner />
      <BrandManifesto />
      <SocialProofBar />
    </>
  );
}
