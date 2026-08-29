import InfoPageLayout from '@/components/layout/InfoPageLayout';
import styles from './page.module.css';

export const metadata = {
  title: 'FAQ | Beyond Stich',
  description: 'Answers to common questions about sizing, fabric, shipping, returns and orders at Beyond Stich.',
  alternates: { canonical: 'https://beyondstich.com/faq' },
};

// Single source of truth for both the visible accordion and the FAQPage
// JSON-LD below — the two used to drift (this answer used to omit Cash on
// Delivery even though the schema told Google it was mentioned).
const FAQ_ITEMS = [
  {
    category: 'Sizing & Fit',
    question: 'How do your tees fit?',
    answer: 'All our tees are cut for an oversized fit, with select drops in super-oversized. If you prefer a regular look, size down. Full measurements are on every product page under "Size Guide".',
  },
  {
    category: 'Sizing & Fit',
    question: 'What fabric do you use?',
    answer: 'Most drops are 240 GSM combed cotton with double-stitched shoulders and high-density prints. The exact fabric is listed on each product page.',
  },
  {
    category: 'Orders & Shipping',
    question: 'When will my order ship?',
    answer: 'Orders are dispatched within 24 hours. Delivery typically takes 3–5 business days depending on your location.',
  },
  {
    category: 'Orders & Shipping',
    question: 'Do you offer free shipping?',
    answer: 'Yes — free shipping on all orders above ₹999. Below that, a flat ₹79 applies.',
  },
  {
    category: 'Returns',
    question: 'Can I return or exchange?',
    answer: 'Yes. We offer easy 7-day returns and exchanges on unworn items with tags intact. See our Returns policy page for full details.',
  },
  {
    category: 'Payments',
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

const CATEGORIES = [...new Set(FAQ_ITEMS.map((item) => item.category))];

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
        {CATEGORIES.map((category) => (
          <section key={category} className={styles.categorySection}>
            <h2>{category}</h2>
            {FAQ_ITEMS.filter((item) => item.category === category).map((item) => (
              <details key={item.question} className={styles.item}>
                <summary className={styles.question}>
                  {item.question}
                  <span className={styles.icon} aria-hidden="true">+</span>
                </summary>
                <p className={styles.answer}>
                  {item.question === 'Can I return or exchange?' ? (
                    <>
                      Yes. We offer easy 7-day returns and exchanges on unworn
                      items with tags intact. See our{' '}
                      <a href="/returns">Returns policy</a> for full details.
                    </>
                  ) : (
                    item.answer
                  )}
                </p>
              </details>
            ))}
          </section>
        ))}
      </InfoPageLayout>
    </>
  );
}
