'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useWishlistStore } from '@/lib/store';
import ProductCard from '@/components/product/ProductCard';
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
            <motion.div 
              className={styles.emptyState}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className={styles.emptyIcon}>🖤</div>
              <h2>YOUR ARSENAL IS EMPTY</h2>
              <p>You haven't saved any drops yet. Start exploring the segments.</p>
              <Link href="/shop" className={styles.browseBtn}>
                EXPLORE ALL DROPS
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
