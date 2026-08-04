'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore } from '@/lib/store';
import ProductCard from '@/components/product/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import styles from './page.module.css';

export default function WishlistPage() {
  const { items } = useWishlistStore();

  return (
    <div className={styles.wishlistPage}>
      <header className={`${styles.header} noise-overlay`}>
        <div className="container">
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            YOUR ARSENAL
          </motion.h1>
          <motion.p 
            className={styles.count}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {items.length} {items.length === 1 ? 'DROP' : 'DROPS'} SAVED
          </motion.p>
        </div>
      </header>

      <section className={`${styles.content} container`}>
        <AnimatePresence mode="popLayout">
          {items.length > 0 ? (
            <motion.div 
              className={styles.grid}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {items.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              }
              title="Your arsenal is empty"
              message="You haven't saved any drops yet. Start exploring the segments."
              actionLabel="Explore all drops"
              actionHref="/shop"
            />
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
