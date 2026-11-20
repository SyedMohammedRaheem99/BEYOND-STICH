'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/lib/store';
import styles from './BottomTabBar.module.css';

// The mobile top bar was carrying the hamburger, a two-line stacked logo,
// search, wishlist, and cart all in one 70px row — everything competed for
// space and the logo (the least frequently *used* element) ended up the
// most visually dominant. A fixed bottom tab bar moves the things people
// actually tap repeatedly — home, shop, cart, account — within thumb reach
// and lets the top bar breathe. Four tabs only, matching the density of
// every mobile-commerce tab bar this pattern is borrowed from.
function HomeIcon({ active }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function ShopIcon({ active }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" fill={active ? 'currentColor' : 'none'} />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function AccountIcon({ active }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { items, openCart } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const isHome = pathname === '/';
  const isShop = pathname === '/shop' || pathname.startsWith('/segment/');
  const isAccount = pathname.startsWith('/account') || pathname === '/login';

  return (
    <nav className={styles.tabbar} aria-label="Primary mobile">
      <Link href="/" className={`${styles.tab} ${isHome ? styles.active : ''}`} aria-current={isHome ? 'page' : undefined}>
        <HomeIcon active={isHome} />
        <span className={styles.label}>Home</span>
      </Link>

      <Link href="/shop" className={`${styles.tab} ${isShop ? styles.active : ''}`} aria-current={isShop ? 'page' : undefined}>
        <ShopIcon active={isShop} />
        <span className={styles.label}>Shop</span>
      </Link>

      <button
        type="button"
        className={styles.tab}
        onClick={openCart}
        aria-label={`Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
      >
        <span className={styles.cartIconWrap}>
          <CartIcon />
          {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
        </span>
        <span className={styles.label}>Cart</span>
      </button>

      <Link
        href={session ? '/account' : '/login'}
        className={`${styles.tab} ${isAccount ? styles.active : ''}`}
        aria-current={isAccount ? 'page' : undefined}
      >
        <AccountIcon active={isAccount} />
        <span className={styles.label}>Account</span>
      </Link>
    </nav>
  );
}
