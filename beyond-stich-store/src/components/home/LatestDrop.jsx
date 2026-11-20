'use client';

import { useState, useEffect } from 'react';
import Section from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import Skeleton from '@/components/ui/Skeleton';
import styles from './LatestDrop.module.css';

const ArrowIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// Matches the server projection in app/page.js — six is the drop size.
const SKELETON_COUNT = 6;

export default function LatestDrop({ initialDrops = [] }) {
  const [drops, setDrops] = useState(initialDrops);
  // Only ever true on the client-fetch fallback path; when the server
  // supplied drops there is no loading phase at all.
  const [loading, setLoading] = useState(initialDrops.length === 0);

  useEffect(() => {
    if (initialDrops.length > 0) return;
    let cancelled = false;

    fetch('/api/products?sort=newest&limit=6')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        setDrops(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [initialDrops]);

  // Previously this returned null while fetching, so the section popped into
  // existence and shoved the page down. Reserve the space with skeletons.
  if (!loading && drops.length === 0) return null;

  return (
    <Section
      eyebrow="Just landed"
      title="Latest Drop"
      bordered
      action={
        <Button href="/shop" variant="secondary" size="sm" icon={<ArrowIcon />}>
          View all
        </Button>
      }
    >
      <div className={styles.grid}>
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton className={styles.skeletonImage} />
                <Skeleton shape="text" width="40%" />
                <Skeleton shape="text" width="75%" height="1.1em" />
                <Skeleton shape="text" width="30%" />
              </div>
            ))
          : drops.map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
      </div>
    </Section>
  );
}
