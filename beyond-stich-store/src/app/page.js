import HeroSection from '@/components/home/HeroSection';
import TrustBar from '@/components/home/TrustBar';
import SegmentGrid from '@/components/home/SegmentGrid';
import LatestDrop from '@/components/home/LatestDrop';
import OfferBanner from '@/components/home/OfferBanner';
import BrandManifesto from '@/components/home/BrandManifesto';
import SocialProofBar from '@/components/home/SocialProofBar';

export const metadata = {
  title: 'Beyond Stich | Wear the thought.',
  description: 'Premium oversized graphic tees for men. GYM, COFFEE, MUSIC, GAMER & more.',
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <SegmentGrid />
      <LatestDrop />
      <OfferBanner />
      <BrandManifesto />
      <SocialProofBar />
    </>
  );
}
