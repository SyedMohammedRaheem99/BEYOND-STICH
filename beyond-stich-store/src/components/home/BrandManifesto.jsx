'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AnimatedHeading, AnimatedParagraph, RevealOnScroll } from '@/components/ui/AnimatedText';
import MagneticButton from '@/components/ui/MagneticButton';
import styles from './BrandManifesto.module.css';

export default function BrandManifesto() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });

  return (
    <section className={`${styles.section} noise-overlay`} ref={ref}>
      <div className={`${styles.container} container`}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>
            <motion.span
              initial={{ width: 0 }}
              animate={isInView ? { width: 40 } : {}}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={styles.line}
            />
            THE MANIFESTO
          </p>

          <h2 className={styles.title}>
            <AnimatedHeading delay={0.2}>
              WE DON'T MAKE CLOTHES. WE MAKE STATEMENTS.
            </AnimatedHeading>
          </h2>

          <div className={styles.textWrap}>
            <AnimatedParagraph delay={0.6} className={styles.text}>
              Every piece from Beyond Stich is designed for those who think different. 
              We're not about fast fashion or basic basics. We build heavy-duty, 
              super-oversized canvases for your mindset.
            </AnimatedParagraph>
            <AnimatedParagraph delay={0.8} className={styles.text}>
              Whether you're pushing steel in the gym, hustling for your millions, 
              or cruising the streets, we have a drop for your world.
            </AnimatedParagraph>
          </div>

          <RevealOnScroll delay={1.2}>
            <MagneticButton href="/about" variant="secondary" className={styles.btn}>
              OUR STORY
            </MagneticButton>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
