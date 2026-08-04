import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Contact Us | Beyond Stich',
  description: 'Get in touch with the Beyond Stich team for support, collabs and press.',
};

export default function ContactPage() {
  return (
    <InfoPageLayout
      eyebrow="HELP"
      title="Contact Us"
      intro="Real humans, quick replies. We usually respond within one business day."
    >
      <h2>Customer support</h2>
      <p>
        For order, sizing, shipping or return queries, email{' '}
        <a href="mailto:hello@beyondstich.com">hello@beyondstich.com</a>. Please
        include your order ID so we can help faster.
      </p>

      <h2>Collabs & press</h2>
      <p>
        Working on something bold? Reach out at{' '}
        <a href="mailto:collab@beyondstich.com">collab@beyondstich.com</a>.
      </p>

      <h2>Social</h2>
      <p>
        DM us on Instagram <strong>@beyondstich</strong> — we're most active there.
      </p>

      <h2>Support hours</h2>
      <p>Monday to Saturday, 10:00 AM – 7:00 PM IST.</p>
    </InfoPageLayout>
  );
}
