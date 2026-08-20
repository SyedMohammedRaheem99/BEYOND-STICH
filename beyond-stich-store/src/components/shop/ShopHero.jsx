import Image from 'next/image';
import { SHOP_HERO_SLIDES } from '@/lib/banners';
import styles from './ShopHero.module.css';

/**
 * Hero band for /shop.
 *
 * The All Drops page had no hero at all — it opened straight onto a promo
 * carousel. This is a plain server component (no carousel, no framer-motion)
 * so the H1 is in the server HTML for Googlebot and the page stays light.
 *
 * Desktop and mobile use genuinely different crops; the hidden one is
 * display:none so it is never fetched.
 */
export default function ShopHero() {
  const slide = SHOP_HERO_SLIDES[0];

  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        <Image
          src={slide.desktop}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className={`${styles.img} ${styles.imgDesktop}`}
          preload
        />
        <Image
          src={slide.mobile}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className={`${styles.img} ${styles.imgMobile}`}
        />
        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <h1 className={styles.headline}>{slide.headline}</h1>
        <p className={styles.sub}>{slide.subheadline}</p>
      </div>
    </section>
  );
}
