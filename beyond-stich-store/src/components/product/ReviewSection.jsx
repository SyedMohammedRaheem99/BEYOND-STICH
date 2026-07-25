'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import styles from './ReviewSection.module.css';

// Dummy reviews
const REVIEWS = [
  {
    id: 1,
    author: 'Rahul S.',
    rating: 5,
    date: '2 months ago',
    title: 'Crazy fit and quality',
    body: 'The 240 GSM feels premium. The print quality is insane and hasn\'t faded after 5 washes. Definitely ordering more.',
    verified: true,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
  },
  {
    id: 2,
    author: 'Karan V.',
    rating: 5,
    date: '1 week ago',
    title: 'Best oversized tee',
    body: 'The drop shoulder is perfect. Fits exactly how I wanted it to. Packaging was also very premium.',
    verified: true,
  },
  {
    id: 3,
    author: 'Vikram M.',
    rating: 4,
    date: '3 days ago',
    title: 'Good, but stock runs out fast',
    body: 'Love the design and the material. Only giving 4 stars because the restock takes too long. Otherwise perfect.',
    verified: true,
  }
];

export default function ReviewSection({ productId, accentColor }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div className={styles.section} ref={ref}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>CUSTOMER REVIEWS</h2>
          <div className={styles.summary}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map(star => (
                <svg key={star} width="20" height="20" viewBox="0 0 24 24" fill={accentColor}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <span className={styles.average}>4.8 out of 5</span>
            <span className={styles.count}>(42 reviews)</span>
          </div>
        </div>
        
        <button 
          className={styles.writeRateBtn}
          style={{ borderColor: accentColor, color: accentColor }}
        >
          WRITE A REVIEW
        </button>
      </div>

      <div className={styles.grid}>
        {REVIEWS.map((review, i) => (
          <motion.div 
            key={review.id}
            className={styles.reviewCard}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className={styles.reviewHeader}>
              <div className={styles.reviewerInfo}>
                <span className={styles.author}>{review.author}</span>
                {review.verified && (
                  <span className={styles.verified}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Verified Buyer
                  </span>
                )}
              </div>
              <span className={styles.date}>{review.date}</span>
            </div>
            
            <div className={styles.reviewStars}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < review.rating ? accentColor : 'none'} stroke={accentColor} strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>

            <h4 className={styles.reviewTitle}>{review.title}</h4>
            <p className={styles.reviewBody}>{review.body}</p>

            {review.image && (
              <div className={styles.reviewImageWrap}>
                <Image
                  src={review.image}
                  alt={`Review by ${review.author}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      <button className={styles.loadMore}>LOAD MORE REVIEWS</button>
    </div>
  );
}
