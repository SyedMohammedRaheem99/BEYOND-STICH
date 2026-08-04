import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { getSegmentImage } from '@/lib/constants';
import styles from './SegmentHero.module.css';

export default function SegmentHero({ segmentData }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const bgImage = getSegmentImage(segmentData.name);

  return (
    <div className={styles.hero} ref={ref}>
      <motion.div className={styles.background} style={{ y }}>
        <Image
          src={bgImage}
          alt={`${segmentData.name} Segment World`}
          fill
          priority
          style={{ objectFit: 'cover' }}
        />
        <div 
          className={styles.overlay} 
          style={{ 
            background: `linear-gradient(to bottom, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.8) 50%, var(--color-bg) 100%)`,
            boxShadow: `inset 0 0 150px ${segmentData.accent}40` 
          }}
        />
      </motion.div>

      <motion.div className={styles.content} style={{ opacity }}>
        <motion.p
          className={styles.eyebrow}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          WELCOME TO THE WORLD OF
        </motion.p>
        
        <motion.h1 
          className={styles.title}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ textShadow: `0 0 40px ${segmentData.accent}80` }}
        >
          {segmentData.name}
        </motion.h1>

        <motion.p 
          className={styles.tagline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {segmentData.tagline}
        </motion.p>
      </motion.div>
    </div>
  );
}
