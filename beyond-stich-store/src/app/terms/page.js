import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'Terms of Service | Beyond Stich',
  description: 'The terms that govern your use of Beyond Stich and any purchases you make.',
};

export default function TermsPage() {
  return (
    <InfoPageLayout eyebrow="LEGAL" title="Terms of Service">
      <p>
        These terms govern your use of Beyond Stich and any purchase you make. By
        placing an order, you agree to them.
      </p>

      <h2>Orders</h2>
      <p>
        All orders are subject to acceptance and availability. We reserve the right
        to cancel any order and refund you in full if an item is unavailable or
        priced in error.
      </p>

      <h2>Pricing</h2>
      <p>
        Prices are listed in INR and include applicable taxes unless stated
        otherwise. We may change prices and run limited-time drops at any time.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All designs, artwork and branding are the property of Beyond Stich and may
        not be reproduced without permission.
      </p>

      <h2>Returns</h2>
      <p>
        Returns and exchanges are governed by our <a href="/returns">Returns policy</a>.
      </p>

      <p><strong>Note:</strong> This is a template and should be reviewed by legal counsel before launch.</p>
    </InfoPageLayout>
  );
}
