import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Shipping | Beyond Stich',
  description: 'Shipping timelines, charges and tracking for Beyond Stich orders across India.',
  alternates: { canonical: 'https://beyondstich.com/shipping' },
};

export default function ShippingPage() {
  return (
    <InfoPageLayout
      eyebrow="HELP"
      title="Shipping"
      intro="Fast, tracked delivery across India."
    >
      <h2>Delivery across India</h2>
      <p>
        We currently ship to all serviceable PIN codes across India. International
        shipping is not available at this time.
      </p>

      <h2>Charges</h2>
      <ul>
        <li><strong>Free shipping</strong> on all orders above ₹999.</li>
        <li>Flat <strong>₹79</strong> on orders below ₹999.</li>
      </ul>

      <h2>Timelines</h2>
      <ul>
        <li>
          Orders are dispatched within <strong>24 hours</strong> of being placed
          (excluding Sundays and public holidays).
        </li>
        <li>
          <strong>Metro cities</strong> (Delhi, Mumbai, Bangalore, Hyderabad,
          Chennai, Kolkata): 2–4 business days.
        </li>
        <li>
          <strong>Other cities &amp; towns:</strong> 4–6 business days.
        </li>
        <li>
          <strong>Remote/rural areas:</strong> 5–7 business days.
        </li>
      </ul>
      <p>
        Delivery timelines are estimates and may vary due to courier operations,
        weather, or other unforeseen circumstances.
      </p>

      <h2>Shipping partners</h2>
      <p>
        We work with trusted logistics providers including <strong>Delhivery</strong>,{' '}
        <strong>Shiprocket</strong>, and <strong>India Post</strong> to ensure safe
        and timely delivery. The carrier is assigned automatically based on your
        PIN code for the fastest possible delivery.
      </p>

      <h2>Order tracking</h2>
      <p>
        Once your order ships, you'll receive a tracking link via email. You can
        also track your order anytime on our{' '}
        <a href="/track">Track Order</a> page using your order number and
        registered email or phone number.
      </p>

      <h2>Non-serviceable areas</h2>
      <p>
        In rare cases, certain remote PIN codes may not be serviceable by our
        courier partners. If your area is non-serviceable, we'll notify you within
        24 hours of placing the order and issue a full refund.
      </p>

      <h2>Questions?</h2>
      <p>
        Email us at{' '}
        <a href="mailto:hello@beyondstich.com">hello@beyondstich.com</a> and
        we'll help you out.
      </p>
    </InfoPageLayout>
  );
}
