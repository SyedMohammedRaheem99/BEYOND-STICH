import Section from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import styles from './ProductSection.module.css';

const ArrowIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

/**
 * One operator-defined product section on the home page.
 *
 * Takes a resolved HomeSection — its title, layout and already-fetched
 * products — so the same component renders "Trending", "Winter Edit" or
 * anything else configured in the admin. Nothing about the copy or the
 * product choice is decided here.
 *
 * A server component: there is no interactivity beyond the cards'
 * own, so this ships no JavaScript of its own.
 */
export default function ProductSection({ section }) {
  const products = section?.products || [];

  // getHomeSections already drops empty sections, but a section rendered
  // directly would otherwise show a heading above nothing.
  if (products.length === 0) return null;

  const isCarousel = section.layout === 'carousel';

  return (
    <Section
      eyebrow={section.eyebrow || undefined}
      title={section.title}
      subtitle={section.subtitle || undefined}
      bordered
      action={
        section.linkHref && section.linkLabel ? (
          <Button href={section.linkHref} variant="secondary" size="sm" icon={<ArrowIcon />}>
            {section.linkLabel}
          </Button>
        ) : undefined
      }
    >
      <div className={isCarousel ? styles.carousel : styles.grid}>
        {products.map((product, index) => (
          <div key={product._id} className={isCarousel ? styles.carouselItem : undefined}>
            <ProductCard product={product} index={index} />
          </div>
        ))}
      </div>
    </Section>
  );
}
