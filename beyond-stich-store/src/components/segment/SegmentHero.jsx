import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './SegmentHero.module.css';

// Placeholder cinematic images for segments
const SEGMENT_IMAGES = {
  GYM: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80',
  COFFEE: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=1600&q=80',
  MILLINIORE: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=1600&q=80',
  MUSIC: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1600&q=80',
  GAMER: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80',
  CARS: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1600&q=80',
  BIKE: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=1600&q=80',
  SUMMER: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
  FLORAL: 'https://images.unsplash.com/photo-1490750967868-88cb4aca8fec?w=1600&q=80',
  SPORTS: 'https://images.unsplash.com/photo-1461896836934-ffe145bf8560?w=1600&q=80',
  VALENTINE: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1600&q=80',
  TYPOGRAPHY: 'https://images.unsplash.com/photo-1585246736484-cf72ba1860a2?w=1600&q=80',
  RANDOMS: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=80',
};

export default function SegmentHero({ segmentData }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const bgImage = SEGMENT_IMAGES[segmentData.name] || SEGMENT_IMAGES.RANDOMS;

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
