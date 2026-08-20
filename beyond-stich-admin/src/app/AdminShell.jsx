'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './layout.module.css';

const ADMIN_NAV = [
  { label: 'OVERVIEW', href: '/', icon: '📊' },
  { label: 'PRODUCTS', href: '/products', icon: '🏷️' },
  { label: 'ORDERS', href: '/orders', icon: '📦' },
  { label: 'INVENTORY', href: '/inventory', icon: '⚡' },
  { label: 'COUPONS', href: '/coupons', icon: '🎟️' },
  { label: 'REVIEWS', href: '/reviews', icon: '⭐' },
  { label: 'ANALYTICS', href: '/analytics', icon: '📈' },
  { label: 'USERS', href: '/users', icon: '👥' },
];

/**
 * Interactive admin chrome. Split out of layout.js so that layout.js can be a
 * Server Component and export `viewport` — without it Next never emits a
 * viewport meta tag, mobile browsers assume a ~980px page, and none of the
 * admin's responsive CSS ever matches.
 */
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Login page renders its own full-page layout
  if (pathname === '/login') {
    return children;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          {/* Same fix as the storefront: this was pointing at the 3.9MB
              6250x6250 master, downloaded in full on every admin page to
              render an 84px-tall wordmark, and declared square dimensions
              for a 3.53:1 image. */}
          <img
            src="/logos/wordmark.png"
            srcSet="/logos/wordmark.png 1x, /logos/wordmark@2x.png 2x, /logos/wordmark@3x.png 3x"
            alt="Beyond Stich"
            className={styles.adminLogoImage}
            width={296}
            height={84}
          />
          <span className={styles.badge}>ADMIN</span>
        </Link>

        <nav className={styles.nav}>
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
