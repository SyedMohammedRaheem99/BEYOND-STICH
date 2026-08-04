import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Our Story | Beyond Stich',
  description:
    'Beyond Stich builds heavy-duty, super-oversized graphic tees for people who think different. This is why we exist.',
};

export default function AboutPage() {
  return (
    <InfoPageLayout
      eyebrow="THE MANIFESTO"
      title="We don't make clothes. We make statements."
      intro="Beyond Stich is a premium streetwear label built for people who wear their mindset on their chest."
    >
      <h2>Why we started</h2>
      <p>
        We were tired of basics. Tired of thin cotton, faded prints, and designs
        that said nothing. So we built the opposite: heavyweight, structured,
        unapologetically oversized canvases for the way you actually think.
      </p>

      <h2>The build</h2>
      <p>
        Every drop starts at <strong>240 GSM combed cotton</strong> with
        double-stitched shoulders and high-density prints engineered to survive
        the wash cycle — and the years. Oversized and super-oversized fits, cut
        to fall exactly how streetwear should.
      </p>

      <h2>Segment worlds</h2>
      <p>
        Instead of one bland catalogue, we build <strong>worlds</strong> — GYM,
        COFFEE, MUSIC, GAMER, CARS and more. Each has its own identity, its own
        colour, its own attitude. You don't shop a size. You enter a world.
      </p>

      <h2>The promise</h2>
      <ul>
        <li>Premium heavyweight fabric on every single drop — no exceptions.</li>
        <li>Limited runs. When a drop is gone, it's gone.</li>
        <li>Designed in-house. Never copied, never generic.</li>
        <li>Free shipping on orders above ₹999, dispatched within 24 hours.</li>
      </ul>

      <p>
        Wear the thought. — <strong>Team Beyond Stich</strong>
      </p>
    </InfoPageLayout>
  );
}
