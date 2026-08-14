import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata = {
  title: 'FAQ | Beyond Stich',
  description: 'Answers to common questions about sizing, fabric, shipping, returns and orders at Beyond Stich.',
};

const FAQ_ITEMS = [
  {
    question: 'How do your tees fit?',
    answer: 'All our tees are cut for an oversized fit, with select drops in super-oversized. If you prefer a regular look, size down. Full measurements are on every product page under "Size Guide".',
  },
  {
    question: 'What fabric do you use?',
    answer: 'Most drops are 240 GSM combed cotton with double-stitched shoulders and high-density prints. The exact fabric is listed on each product page.',
  },
  {
    question: 'When will my order ship?',
    answer: 'Orders are dispatched within 24 hours. Delivery typically takes 3–5 business days depending on your location.',
  },
  {
    question: 'Do you offer free shipping?',
    answer: 'Yes — free shipping on all orders above ₹999. Below that, a flat ₹79 applies.',
  },
  {
    question: 'Can I return or exchange?',
    answer: 'Yes. We offer easy 7-day returns and exchanges on unworn items with tags intact. See our Returns policy page for full details.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major UPI apps, credit/debit cards, net banking, and wallets through a secure encrypted checkout. Cash on Delivery is also available.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <InfoPageLayout
      eyebrow="HELP"
      title="FAQ"
      intro="Everything you need to know before you drop. Still stuck? Reach us at hello@beyondstich.com."
    >
      <h2>Sizing & Fit</h2>
      <h3>How do your tees fit?</h3>
      <p>
        All our tees are cut for an <strong>oversized</strong> fit, with select
        drops in <strong>super-oversized</strong>. If you prefer a regular look,
        size down. Full measurements are on every product page under “Size Guide”.
      </p>
      <h3>What fabric do you use?</h3>
      <p>
        Most drops are 240 GSM combed cotton with double-stitched shoulders and
        high-density prints. The exact fabric is listed on each product page.
      </p>

      <h2>Orders & Shipping</h2>
      <h3>When will my order ship?</h3>
      <p>
        Orders are dispatched within 24 hours. Delivery typically takes 3–5
        business days depending on your location.
      </p>
      <h3>Do you offer free shipping?</h3>
      <p>Yes — free shipping on all orders above ₹999. Below that, a flat ₹79 applies.</p>

      <h2>Returns</h2>
      <h3>Can I return or exchange?</h3>
      <p>
        Yes. We offer easy 7-day returns and exchanges on unworn items with tags
        intact. See our <a href="/returns">Returns policy</a> for details.
      </p>

      <h2>Payments</h2>
      <h3>What payment methods do you accept?</h3>
      <p>
        We accept all major UPI apps, cards, net banking and wallets through a
        secure, encrypted checkout.
      </p>
    </InfoPageLayout>
    </>
  );
}
