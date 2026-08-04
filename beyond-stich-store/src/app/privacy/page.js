import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Privacy Policy | Beyond Stich',
  description: 'How Beyond Stich collects, uses and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <InfoPageLayout eyebrow="LEGAL" title="Privacy Policy">
      <p>
        This policy explains what information we collect and how we use it. By
        using Beyond Stich, you agree to the practices described here.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Contact and shipping details you provide at checkout.</li>
        <li>Order history and preferences to improve your experience.</li>
        <li>Basic analytics about how the site is used.</li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use your information to process orders, provide support, prevent fraud
        and — only if you opt in — send you drop announcements. We never sell your
        personal data.
      </p>

      <h2>Your choices</h2>
      <p>
        You can unsubscribe from marketing at any time and request access to or
        deletion of your data by emailing{' '}
        <a href="mailto:hello@beyondstich.com">hello@beyondstich.com</a>.
      </p>

      <p><strong>Note:</strong> This is a template policy and should be reviewed by legal counsel before launch.</p>
    </InfoPageLayout>
  );
}
