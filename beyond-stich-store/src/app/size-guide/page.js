import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Size Guide | Beyond Stich',
  description: 'Oversized fit measurements and how to measure for the perfect Beyond Stich tee.',
  alternates: { canonical: 'https://beyondstich.com/size-guide' },
};

export default function SizeGuidePage() {
  return (
    <InfoPageLayout
      eyebrow="HELP"
      title="Size Guide"
      intro="Our tees run oversized. Prefer a regular look? Size down."
    >
      <h2>Measurements (inches)</h2>
      <ul>
        <li><strong>S</strong> — Chest 42&quot; · Length 27&quot; · Shoulder 21&quot;</li>
        <li><strong>M</strong> — Chest 44&quot; · Length 28&quot; · Shoulder 22&quot;</li>
        <li><strong>L</strong> — Chest 46&quot; · Length 29&quot; · Shoulder 23&quot;</li>
        <li><strong>XL</strong> — Chest 48&quot; · Length 30&quot; · Shoulder 24&quot;</li>
        <li><strong>XXL</strong> — Chest 50&quot; · Length 31&quot; · Shoulder 25&quot;</li>
      </ul>

      <h2>How to measure</h2>
      <ul>
        <li><strong>Chest:</strong> measure across the fullest part, armpit to armpit, and double it.</li>
        <li><strong>Length:</strong> from the highest point of the shoulder straight down to the hem.</li>
        <li><strong>Shoulder:</strong> from one shoulder seam across to the other.</li>
      </ul>

      <p>
        Tip: lay a tee you already love flat and compare it to the numbers above
        for the most accurate fit.
      </p>
    </InfoPageLayout>
  );
}
