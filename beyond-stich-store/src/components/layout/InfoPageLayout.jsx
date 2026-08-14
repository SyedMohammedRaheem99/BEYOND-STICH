import styles from './InfoPageLayout.module.css';

/**
 * Shared premium wrapper for static content pages (About, FAQ, policies…).
 * Pass plain semantic children (h2/h3/p/ul) — they are styled automatically.
 *
 * A server component: the heading's fade-in used to be the only reason this
 * (and every page using it — About, FAQ, Privacy, Returns, Shipping, Size
 * Guide, Terms, Contact) shipped React + framer-motion to the client. It's a
 * CSS animation now, so those 8 pages are fully static — exactly the pages
 * Google reads most closely for E-E-A-T.
 */
export default function InfoPageLayout({ eyebrow = 'BEYOND STICH', title, intro, children }) {
  return (
    <div className={styles.page}>
      <header className={`${styles.hero} noise-overlay`}>
        <div className="container">
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={`${styles.title} ${styles.titleAnimated}`}>{title}</h1>
          {intro && <p className={styles.intro}>{intro}</p>}
        </div>
      </header>

      <div className={`${styles.body} container`}>{children}</div>
    </div>
  );
}
