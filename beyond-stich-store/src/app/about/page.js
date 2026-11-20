import Link from 'next/link';
import Button from '@/components/ui/Button';
import { BRAND } from '@/lib/constants';
import styles from './page.module.css';

export const metadata = {
  title: 'Our Story | Beyond Stich',
  description:
    'Beyond Stich builds heavyweight 240 GSM oversized graphic tees in Bangalore. Combed cotton, high-density prints, limited drops. This is how — and why — we make them.',
  alternates: { canonical: 'https://beyondstich.com/about' },
};

// Hard numbers beat adjectives. Every figure here is a real spec from the
// product pages — nothing invented for marketing copy.
const SPECS = [
  { value: '240', unit: 'GSM', label: 'Combed cotton' },
  { value: '13', unit: '', label: 'Segment worlds' },
  { value: '24', unit: 'HR', label: 'Dispatch' },
  { value: '7', unit: 'DAY', label: 'Easy returns' },
];

const BUILD = [
  {
    title: 'The fabric',
    body: '240 GSM combed cotton — roughly twice the weight of a standard printed tee. It holds its shape through the wash instead of going thin and shapeless after a month.',
  },
  {
    title: 'The cut',
    body: 'Oversized and super-oversized, with a genuine drop shoulder. Cut to fall the way streetwear is supposed to fall, not a regular tee ordered two sizes up.',
  },
  {
    title: 'The print',
    body: 'High-density prints that sit on the fabric rather than soaking into it. Designed to survive the wash cycle, not just the product photo.',
  },
  {
    title: 'The finish',
    body: 'Double-stitched shoulders and reinforced seams — the two places a heavyweight tee fails first if nobody bothers.',
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      {/* Statement */}
      <header className={styles.hero}>
        <div className="container">
          <p className={styles.eyebrow}>The manifesto</p>
          <h1 className={styles.title}>
            We don&apos;t make
            <br />
            clothes. We make
            <br />
            <span className={styles.titleAccent}>statements.</span>
          </h1>
          <p className={styles.intro}>
            Beyond Stich is a streetwear label from Bangalore, built for people
            who wear their mindset on their chest. Heavyweight fabric, limited
            runs, and designs that actually say something.
          </p>
        </div>
      </header>

      {/* Specs — the proof, immediately after the claim */}
      <section className={styles.specStrip}>
        <div className={`${styles.specGrid} container`}>
          {SPECS.map((s) => (
            <div key={s.label} className={styles.spec}>
              <span className={styles.specValue}>
                {s.value}
                {s.unit && <span className={styles.specUnit}>{s.unit}</span>}
              </span>
              <span className={styles.specLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className={styles.section}>
        <div className={`${styles.narrow} container`}>
          <p className={styles.kicker}>Why we started</p>
          <p className={styles.lead}>
            We were tired of basics. Thin cotton, prints that cracked after
            three washes, and graphics that said nothing at all.
          </p>
          <p className={styles.body}>
            So we built the opposite. Every Beyond Stich drop starts from the
            fabric up — heavy, structured, and unapologetically oversized. The
            kind of tee that still looks like itself a year later. We&apos;d
            rather make fewer things properly than fill a catalogue.
          </p>
        </div>
      </section>

      {/* How it's built */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <p className={styles.kicker}>How it&apos;s built</p>
          <h2 className={styles.sectionTitle}>No shortcuts in the spec sheet</h2>
          <div className={styles.buildGrid}>
            {BUILD.map((b, i) => (
              <div key={b.title} className={styles.buildCard}>
                <span className={styles.buildNum}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className={styles.buildTitle}>{b.title}</h3>
                <p className={styles.buildBody}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Worlds */}
      <section className={styles.section}>
        <div className={`${styles.narrow} container`}>
          <p className={styles.kicker}>Segment worlds</p>
          <h2 className={styles.sectionTitle}>You don&apos;t shop a size. You enter a world.</h2>
          <p className={styles.body}>
            Instead of one flat catalogue, we build worlds — GYM, COFFEE, MUSIC,
            GAMER, CARS and more. Each has its own identity, its own colour, and
            its own attitude. Find the one that already sounds like you.
          </p>
          <Button href="/shop" variant="secondary" size="lg" className={styles.inlineCta}>
            Explore the drops
          </Button>
        </div>
      </section>

      {/* Founder */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={`${styles.narrow} container`}>
          <p className={styles.kicker}>Who we are</p>
          <blockquote className={styles.quote}>
            &ldquo;Streetwear should mean something. If a tee doesn&apos;t say
            anything, it&apos;s just fabric.&rdquo;
          </blockquote>
          <p className={styles.body}>
            Beyond Stich was founded by <strong>Mohammed Raheem</strong> in
            Bangalore, India. What started as a one-person idea now designs,
            produces and ships premium graphic tees across the country — still
            run by a small team that reads every message.
          </p>
          <p className={styles.signature}>
            Wear the thought. — Team Beyond Stich
          </p>
        </div>
      </section>

      {/* Close */}
      <section className={styles.closing}>
        <div className="container">
          <h2 className={styles.closingTitle}>Find your world.</h2>
          <p className={styles.closingBody}>
            Limited runs. When a drop is gone, it&apos;s gone.
          </p>
          <div className={styles.closingActions}>
            <Button href="/shop" variant="primary" size="lg">
              Shop all drops
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Talk to us
            </Button>
          </div>
          <p className={styles.contactLine}>
            Questions? <Link href="/contact">{BRAND.email}</Link> ·{' '}
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer">
              {BRAND.instagramHandle}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
