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
        For order, sizing, shipping or return queries:
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:hello@beyondstich.com">hello@beyondstich.com</a>
        </li>
        <li>
          <strong>WhatsApp:</strong>{' '}
          <a href="https://wa.me/918310273670" target="_blank" rel="noopener noreferrer">
            +91 83102 73670
          </a>
        </li>
        <li>
          <strong>Instagram DM:</strong>{' '}
          <a href="https://instagram.com/beyondstich" target="_blank" rel="noopener noreferrer">
            @beyondstich
          </a>
        </li>
      </ul>
      <p>
        Please include your <strong>order number</strong> in all communications
        so we can help faster.
      </p>

      <h2>Collabs &amp; press</h2>
      <p>
        Working on something bold? Reach out at{' '}
        <a href="mailto:collab@beyondstich.com">collab@beyondstich.com</a>.
      </p>

      <h2>Support hours</h2>
      <p>Monday to Saturday, 10:00 AM – 7:00 PM IST.</p>
      <p>
        Emails received outside business hours are responded to on the next
        working day.
      </p>

      <h2>Based in</h2>
      <p>Bangalore, India</p>
    </InfoPageLayout>
  );
}
