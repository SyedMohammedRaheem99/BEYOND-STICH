import HeroSection from '@/components/home/HeroSection';
import SegmentGrid from '@/components/home/SegmentGrid';
import LatestDrop from '@/components/home/LatestDrop';
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
      <SegmentGrid />
      <LatestDrop />
      <BrandManifesto />
      <SocialProofBar />
    </>
  );
}
