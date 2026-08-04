'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, useUIStore } from '@/lib/store';
import { getFeaturedProducts } from '@/lib/data/products';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getSubtotal,
    getSavings,
    getShipping,
    getTotal,
  } = useCartStore();

  const { setCursorVariant, resetCursor } = useUIStore();
  const closeBtnRef = useRef(null);

  // Close on Escape, lock body scroll, and move focus into the drawer on open.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 50);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      clearTimeout(focusTimer);
    };
  }, [isOpen, closeCart]);

  const subtotal = getSubtotal();
  const savings = getSavings();
  const shipping = getShipping();
  const total = getTotal();
  const freeShippingThreshold = 999;
  const freeShippingProgress = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  // Cross-sell: featured products not already in the bag.
  const inCart = new Set(items.map((i) => i.productId));
  const suggestions = getFeaturedProducts(6).filter((p) => !inCart.has(p._id)).slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.title} id="cart-drawer-title">YOUR BAG</h2>
              <span className={styles.count}>
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
              <button
                className={styles.closeBtn}
                onClick={closeCart}
                aria-label="Close cart"
                ref={closeBtnRef}
              >
                ✕
              </button>
            </div>

            {/* Free Shipping Progress */}
            {items.length > 0 && subtotal < freeShippingThreshold && (
              <div className={styles.shippingProgress}>
                <p className={styles.shippingText}>
                  Add ₹{freeShippingThreshold - subtotal} more for{' '}
                  <strong>FREE shipping</strong>
                </p>
                <div className={styles.progressBar}>
                  <motion.div
                    className={styles.progressFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShippingProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className={styles.items}>
              {items.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>Your bag is empty</p>
                  <Link
                    href="/shop"
                    className={styles.shopLink}
                    onClick={closeCart}
                  >
                    SHOP ALL DROPS →
                  </Link>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className={styles.item}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={styles.itemImage}>
                      <Image
                        src={item.image || '/images/placeholder.jpg'}
                        alt={item.name}
                        width={80}
                        height={100}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <p className={styles.itemMeta}>
                        Size: {item.size} · {item.color}
                      </p>
                      <div className={styles.itemBottom}>
                        <div className={styles.quantityControl}>
                          <button
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity - 1
                              )
                            }
                          >
                            −
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            aria-label={`Increase quantity of ${item.name}`}
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.color,
                                item.quantity + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <span className={styles.itemPrice}>
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                    <button
                      className={styles.removeBtn}
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() =>
                        removeItem(item.productId, item.size, item.color)
                      }
                    >
                      ✕
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Complete the fit (cross-sell) */}
            {items.length > 0 && suggestions.length > 0 && (
              <div className={styles.crossSell}>
                <h3 className={styles.crossSellTitle}>COMPLETE THE FIT</h3>
                <div className={styles.crossSellRow}>
                  {suggestions.map((p) => (
                    <Link
                      key={p._id}
                      href={`/product/${p.slug}`}
                      className={styles.crossSellItem}
                      onClick={closeCart}
                    >
                      <div className={styles.crossSellImg}>
                        <Image src={p.images[0]} alt={p.name} fill sizes="80px" style={{ objectFit: 'cover' }} />
                      </div>
                      <span className={styles.crossSellName}>{p.name}</span>
                      <span className={styles.crossSellPrice}>₹{p.price}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className={styles.footer}>
                {savings > 0 && (
                  <div className={styles.savingsRow}>
                    <span>You save</span>
                    <span className={styles.savingsAmount}>₹{savings}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <div>
                    <span className={styles.totalLabel}>Total</span>
                    {shipping === 0 && (
                      <span className={styles.freeShipping}>Free Shipping</span>
                    )}
                  </div>
                  <span className={styles.totalAmount}>₹{total}</span>
                </div>
                <Link
                  href="/checkout"
                  className={styles.checkoutBtn}
                  onClick={closeCart}
                  onMouseEnter={() => setCursorVariant('hover')}
                  onMouseLeave={resetCursor}
                >
                  CHECKOUT — ₹{total}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
