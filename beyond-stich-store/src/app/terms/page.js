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
        placing an order, you agree to them. Please read them carefully before
        making a purchase.
      </p>

      <h2>Orders &amp; acceptance</h2>
      <p>
        All orders are subject to acceptance and availability. We reserve the right
        to cancel any order and refund you in full if an item is unavailable or
        priced in error. An order confirmation email does not guarantee acceptance —
        the contract is formed only when the item is dispatched.
      </p>

      <h2>Pricing &amp; taxes</h2>
      <p>
        Prices are listed in INR and include all applicable taxes (GST) unless
        stated otherwise. We may change prices and run limited-time drops at any
        time without prior notice. Price changes do not affect orders already placed
        and confirmed.
      </p>

      <h2>Payment</h2>
      <p>
        We accept UPI, debit/credit cards, net banking and popular wallets via our
        payment partner Razorpay. All transactions are processed on secure,
        PCI-DSS compliant infrastructure. We do not store your card details on our
        servers.
      </p>

      <h2>Shipping &amp; delivery</h2>
      <p>
        Shipping timelines and charges are detailed on our{' '}
        <a href="/shipping">Shipping page</a>. Estimated delivery dates are
        indicative and not guaranteed. We are not liable for delays caused by
        courier partners, weather, or force majeure events.
      </p>

      <h2>Returns &amp; refunds</h2>
      <p>
        Returns and exchanges are governed by our{' '}
        <a href="/returns">Returns &amp; Exchanges policy</a>. Refunds are
        processed to the original payment method within 5–7 business days after
        the returned item passes inspection.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All designs, artwork, logos, graphics, and branding on this website are the
        exclusive property of Beyond Stich. You may not reproduce, distribute, or
        use any content from this site without prior written permission.
      </p>

      <h2>User conduct</h2>
      <p>
        You agree not to misuse the site — including attempting to place fraudulent
        orders, interfere with site functionality, or submit false reviews. We
        reserve the right to refuse service to anyone who violates these terms.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Beyond Stich provides products on an "as-is" basis. To the maximum extent
        permitted by law, we are not liable for any indirect, incidental, or
        consequential damages arising from the use of our products or website. Our
        total liability shall not exceed the amount paid by you for the specific
        order in question.
      </p>

      <h2>Warranties &amp; disclaimers</h2>
      <p>
        We stand behind the quality of our products. However, we do not warrant
        that colours on screen will exactly match the physical product, as display
        settings vary. Minor variations in fabric texture, weight, and print
        placement are inherent to our production process and are not considered
        defects.
      </p>

      <h2>Dispute resolution</h2>
      <p>
        If you have a concern about an order, please contact us at{' '}
        <a href="mailto:hello@beyondstich.com">hello@beyondstich.com</a> first.
        We'll do our best to resolve it directly. If a resolution cannot be reached,
        disputes shall be subject to arbitration under the Arbitration and
        Conciliation Act, 1996, with the seat of arbitration in Bangalore, India.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. Any legal proceedings shall
        be subject to the exclusive jurisdiction of the courts in Bangalore,
        Karnataka.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the site after
        changes are posted constitutes your acceptance of the revised terms. The
        latest version will always be available on this page.
      </p>

      <p style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.85rem' }}>
        Last updated: August 2026
      </p>
    </InfoPageLayout>
  );
}
