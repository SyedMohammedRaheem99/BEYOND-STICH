import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Returns & Exchanges | Beyond Stich',
  description: 'Our easy 7-day returns and exchange policy for Beyond Stich orders.',
};

export default function ReturnsPage() {
  return (
    <InfoPageLayout
      eyebrow="HELP"
      title="Returns & Exchanges"
      intro="Not the vibe you expected? We've got you."
    >
      <h2>7-day window</h2>
      <p>
        You can return or exchange any item within <strong>7 days</strong> of
        delivery, as long as it's unworn, unwashed and has its original tags
        intact.
      </p>

      <h2>How it works</h2>
      <ul>
        <li>Raise a request from your account or email <a href="/contact">support</a>.</li>
        <li>We'll arrange a pickup from your address.</li>
        <li>Once we receive and inspect the item, your refund or exchange is processed.</li>
      </ul>

      <h2>Refunds</h2>
      <p>
        Refunds are issued to your original payment method within{' '}
        <strong>5–7 business days</strong> of the returned item passing inspection.
      </p>

      <h2>Exceptions</h2>
      <p>
        For hygiene reasons, items that are worn, washed, or missing tags cannot be
        returned. Clearance/final-sale items are non-returnable and marked as such.
      </p>
    </InfoPageLayout>
  );
}
