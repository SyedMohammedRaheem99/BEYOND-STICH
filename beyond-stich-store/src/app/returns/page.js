import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Returns & Exchanges | Beyond Stich',
  description: 'Our easy 7-day returns and exchange policy for Beyond Stich orders.',
  alternates: { canonical: 'https://beyondstich.com/returns' },
};

export default function ReturnsPage() {
  return (
    <InfoPageLayout
      eyebrow="HELP"
      title="Returns & Exchanges"
      intro="Not the vibe you expected? We've got you."
    >
      <h2>7-day return window</h2>
      <p>
        You can return or exchange any item within <strong>7 days</strong> of
        delivery, as long as it's unworn, unwashed and has its original tags
        intact.
      </p>

      <h2>How to initiate a return</h2>
      <ol>
        <li>
          Email us at{' '}
          <a href="mailto:hello@beyondstich.com">hello@beyondstich.com</a> with
          your order number and reason for the return.
        </li>
        <li>We'll confirm eligibility and arrange a reverse pickup from your address.</li>
        <li>Pack the item in its original packaging with tags attached.</li>
        <li>Once we receive and inspect the item, your refund or exchange is processed.</li>
      </ol>

      <h2>Refund process</h2>
      <ul>
        <li>
          Refunds are issued to your <strong>original payment method</strong>{' '}
          (UPI, card, net banking, or wallet).
        </li>
        <li>
          Processing time: <strong>5–7 business days</strong> after the returned
          item passes our quality inspection.
        </li>
        <li>
          Shipping charges (if any) are non-refundable unless the return is due to
          a defect or wrong item sent by us.
        </li>
      </ul>

      <h2>Exchanges</h2>
      <p>
        Want a different size or colour? We'll ship the replacement within{' '}
        <strong>2–3 business days</strong> of receiving your return, subject to
        stock availability. If the requested variant is out of stock, we'll issue a
        full refund instead.
      </p>

      <h2>Damaged or defective items</h2>
      <p>
        If you receive a damaged or defective item, email us within{' '}
        <strong>48 hours</strong> of delivery with photos. We'll send a free
        replacement or full refund — no questions asked.
      </p>

      <h2>Exceptions</h2>
      <p>
        For hygiene reasons, items that are worn, washed, altered, or missing tags
        cannot be returned. Clearance and final-sale items are non-returnable and
        are clearly marked as such on the product page.
      </p>

      <h2>Disputes &amp; chargebacks</h2>
      <p>
        If you're unhappy with a resolution, please reach out to us at{' '}
        <a href="mailto:hello@beyondstich.com">hello@beyondstich.com</a> before
        filing a chargeback with your bank. We're committed to resolving every
        concern fairly and quickly.
      </p>
    </InfoPageLayout>
  );
}
