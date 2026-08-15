'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import styles from './layout.module.css';

const ACCOUNT_NAV = [
  { label: 'DASHBOARD', href: '/account', icon: '📊' },
  { label: 'ORDERS', href: '/account/orders', icon: '📦' },
  { label: 'WISHLIST', href: '/account/wishlist', icon: '❤️' },
  { label: 'PROFILE', href: '/account/profile', icon: '👤' },
  { label: 'ADDRESSES', href: '/account/addresses', icon: '📍' },
  // "Where is my order" is the top query for a COD store, and the account
  // area — where it gets asked — had no route to tracking or support.
  { label: 'TRACK ORDER', href: '/track', icon: '🚚' },
  { label: 'HELP', href: '/contact', icon: '💬' },
];

export default function AccountLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // The wishlist works from local storage and needs no account, and the
    // navbar heart is visible to everyone — but this effect redirected
    // logged-out visitors to login anyway. Only the render guards below were
    // exempted, not the redirect itself.
    if (status === 'unauthenticated' && pathname !== '/account/wishlist') {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // Allow wishlist page to work without auth (it uses local store)
  if (status === 'loading' && pathname !== '/account/wishlist') {
    return (
      <div className={styles.accountLayout}>
        <div style={{ padding: '60px', color: '#666', width: '100%', textAlign: 'center' }}>
          Loading...
        </div>
      </div>
    );
  }

  // If unauthenticated and not on wishlist, don't render (redirect happening)
  if (status === 'unauthenticated' && pathname !== '/account/wishlist') {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className={styles.accountLayout}>
      <aside className={styles.sidebar}>
        <span className={styles.sidebarTitle}>MY ACCOUNT</span>
        {ACCOUNT_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            LOGOUT
          </button>
        </div>
      </aside>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
