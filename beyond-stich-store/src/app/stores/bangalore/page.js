import Link from 'next/link';
import { SEGMENTS } from '@/lib/constants';
import styles from './page.module.css';

export const metadata = {
  title: 'Beyond Stich Bangalore — Premium Oversized Graphic Tees | Same-Day Delivery',
  description:
    'Shop Beyond Stich oversized graphic tees in Bangalore. 240 GSM premium cotton, 13 exclusive segment worlds, COD available, fast delivery across Indiranagar, Koramangala, HSR Layout & more.',
  alternates: {
    canonical: 'https://beyondstich.com/stores/bangalore',
  },
};

const BANGALORE_AREAS = [
  'Indiranagar',
  'Koramangala',
  'Jayanagar',
  'HSR Layout',
  'Whitefield',
  'Malleshwaram',
  'JP Nagar',
  'Electronic City',
  'MG Road',
  'Brigade Road',
  'Commercial Street',
];

const LOCAL_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  'name': 'Beyond Stich — Bangalore',
  'url': 'https://beyondstich.com/stores/bangalore',
  'areaServed': {
    '@type': 'City',
    'name': 'Bangalore',
    'sameAs': 'https://en.wikipedia.org/wiki/Bangalore',
  },
};

export default function BangalorePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_SCHEMA) }}
      />

      <main className={styles.page}>
        <div className={styles.container}>
          {/* Hero */}
          <section className={styles.hero}>
            <h1 className={styles.h1}>BEYOND STICH — BANGALORE</h1>
            <p className={styles.intro}>
              Born in Bangalore, built for the bold. Beyond Stich started in the
              heart of India's tech and culture capital — a city that runs on
              coffee, code, and creativity. Every tee we make carries that
              Bangalore DNA: sharp design, premium craft, zero compromise.
            </p>
          </section>

          {/* Why Bangalore */}
          <section className={styles.section}>
            <h2 className={styles.h2}>Why Bangalore Loves Beyond Stich</h2>
            <div className={styles.appealGrid}>
              <div className={styles.appealCard}>
                <h3 className={styles.appealTitle}>Designed Here</h3>
                <p className={styles.appealText}>
                  Every graphic is conceptualised in Bangalore. We draw from the
                  city's street art, startup energy, and nightlife to create
                  designs you won't find anywhere else.
                </p>
              </div>
              <div className={styles.appealCard}>
                <h3 className={styles.appealTitle}>Premium Quality</h3>
                <p className={styles.appealText}>
                  240 GSM combed cotton that survives Bangalore's monsoons and
                  weekend rides. Oversized fit that feels right whether you're at
                  a co-working space or a rooftop gig.
                </p>
              </div>
              <div className={styles.appealCard}>
                <h3 className={styles.appealTitle}>COD Available</h3>
                <p className={styles.appealText}>
                  Cash on delivery across Bangalore. Pay when you're happy with
                  what you see — no risk, no fuss.
                </p>
              </div>
              <div className={styles.appealCard}>
                <h3 className={styles.appealTitle}>Fast Delivery</h3>
                <p className={styles.appealText}>
                  Being a Bangalore-born brand means your order moves fast.
                  Same-day dispatch for orders placed before 2 PM.
                </p>
              </div>
            </div>
          </section>

          {/* Delivery Areas */}
          <section className={styles.section}>
            <h2 className={styles.h2}>Delivery in Bangalore</h2>
            <p className={styles.sectionText}>
              We deliver across all of Bangalore — from the leafy lanes of
              Indiranagar to the tech parks of Whitefield. Fast, tracked
              shipping to every pin code in the city.
            </p>
            <div className={styles.areasGrid}>
              {BANGALORE_AREAS.map((area) => (
                <span key={area} className={styles.areaTag}>
                  {area}
                </span>
              ))}
            </div>
          </section>

          {/* What We Offer */}
          <section className={styles.section}>
            <h2 className={styles.h2}>What We Offer</h2>
            <div className={styles.offerGrid}>
              <div className={styles.offerItem}>
                <span className={styles.offerValue}>13</span>
                <span className={styles.offerLabel}>Segment Worlds</span>
              </div>
              <div className={styles.offerItem}>
                <span className={styles.offerValue}>₹799–999</span>
                <span className={styles.offerLabel}>Price Range</span>
              </div>
              <div className={styles.offerItem}>
                <span className={styles.offerValue}>240 GSM</span>
                <span className={styles.offerLabel}>Combed Cotton</span>
              </div>
              <div className={styles.offerItem}>
                <span className={styles.offerValue}>Oversized</span>
                <span className={styles.offerLabel}>Perfect Fit</span>
              </div>
            </div>
          </section>

          {/* Segment Links */}
          <section className={styles.section}>
            <h2 className={styles.h2}>Explore Our Segments</h2>
            <div className={styles.segmentGrid}>
              {SEGMENTS.map((seg) => (
                <Link
                  key={seg.id}
                  href={`/segment/${seg.id}`}
                  className={styles.segmentLink}
                  style={{ '--seg-accent': seg.accent }}
                >
                  <span className={styles.segmentName}>{seg.name}</span>
                  <span className={styles.segmentTagline}>{seg.tagline}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className={styles.ctaSection}>
            <Link href="/shop" className={styles.ctaButton}>
              SHOP NOW
            </Link>
          </section>

          {/* Contact */}
          <section className={styles.section}>
            <h2 className={styles.h2}>Get in Touch</h2>
            <div className={styles.contactInfo}>
              <p>
                Email:{' '}
                <a href="mailto:hello@beyondstich.com" className={styles.contactLink}>
                  hello@beyondstich.com
                </a>
              </p>
              <p>
                WhatsApp:{' '}
                <a
                  href="https://wa.me/918310273670"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactLink}
                >
                  +91 83102 73670
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
