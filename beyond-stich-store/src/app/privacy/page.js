import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Privacy Policy | Beyond Stich',
  description: 'How Beyond Stich collects, uses and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <InfoPageLayout eyebrow="LEGAL" title="Privacy Policy">
      <p>
        Your privacy matters to us. This policy explains what information we
        collect, how we use it, and the choices available to you. By using Beyond
        Stich, you agree to the practices described here.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account &amp; order information:</strong> Name, email, phone
          number, shipping address, and order history when you place an order.
        </li>
        <li>
          <strong>Payment information:</strong> Processed securely by Razorpay. We
          do not store your card number, CVV, or bank credentials on our servers.
        </li>
        <li>
          <strong>Usage data:</strong> Pages visited, time spent, device type, and
          browser information via analytics tools to improve your shopping
          experience.
        </li>
        <li>
          <strong>Cookies:</strong> We use essential cookies for cart and session
          management, and optional analytics cookies. You can manage cookie
          preferences in your browser settings.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To process and fulfil your orders and provide shipping updates.</li>
        <li>To provide customer support and respond to queries.</li>
        <li>To prevent fraud and protect against unauthorised transactions.</li>
        <li>To send drop announcements and offers — only if you opt in.</li>
        <li>To improve our website, products, and services through aggregated analytics.</li>
      </ul>

      <h2>Third-party sharing</h2>
      <p>
        We share your data only with trusted partners essential to fulfilling your
        order:
      </p>
      <ul>
        <li><strong>Razorpay</strong> — payment processing.</li>
        <li><strong>Shipping partners</strong> — delivery of your order.</li>
        <li><strong>Cloudinary</strong> — image hosting (no personal data shared).</li>
      </ul>
      <p>
        We never sell, rent, or trade your personal information to third parties
        for marketing purposes.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain your order data for as long as necessary to fulfil legal,
        accounting, and business obligations — typically up to 5 years for tax and
        compliance purposes. You may request earlier deletion of non-essential data
        at any time.
      </p>

      <h2>Data security</h2>
      <p>
        We use industry-standard measures including HTTPS encryption, secure
        databases, and access controls to protect your information. However, no
        method of electronic transmission is 100% secure, and we cannot guarantee
        absolute security.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
        <li><strong>Correction:</strong> Ask us to update inaccurate information.</li>
        <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal obligations.</li>
        <li><strong>Opt-out:</strong> Unsubscribe from marketing emails at any time using the link in the email.</li>
      </ul>
      <p>
        To exercise any of these rights, email{' '}
        <a href="mailto:hello@beyondstich.com">hello@beyondstich.com</a> with the
        subject line "Privacy Request".
      </p>

      <h2>Children's privacy</h2>
      <p>
        Our site is not intended for children under 18. We do not knowingly collect
        personal information from minors.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Changes will be posted on this
        page with a revised date. Continued use of the site constitutes your
        acceptance of the updated policy.
      </p>

      <p style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.85rem' }}>
        Last updated: August 2026
      </p>
    </InfoPageLayout>
  );
}
