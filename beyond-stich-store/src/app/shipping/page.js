import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Shipping | Beyond Stich',
  description: 'Shipping timelines, charges and tracking for Beyond Stich orders across India.',
};

export default function ShippingPage() {
  return (
    <InfoPageLayout
      eyebrow="HELP"
      title="Shipping"
      intro="Fast, tracked delivery across India."
    >
      <h2>Charges</h2>
      <ul>
        <li><strong>Free shipping</strong> on all orders above ₹999.</li>
        <li>Flat ₹79 on orders below ₹999.</li>
      </ul>

      <h2>Timelines</h2>
      <p>
        Orders are dispatched within <strong>24 hours</strong> of being placed.
        Standard delivery takes <strong>3–5 business days</strong>, depending on
        your PIN code. Metro cities are usually faster.
      </p>

      <h2>Tracking</h2>
      <p>
        As soon as your order ships, we'll email you a tracking link. You can also
        track it any time from your account.
      </p>

      <h2>Questions?</h2>
      <p>
        Email <a href="/contact">our support team</a> and we'll help you out.
      </p>
    </InfoPageLayout>
  );
}
