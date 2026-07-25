'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './layout.module.css';

const ADMIN_NAV = [
  { label: 'OVERVIEW', href: '/', icon: '📊' },
  { label: 'PRODUCTS', href: '/products', icon: '🏷️' },
  { label: 'ORDERS', href: '/orders', icon: '📦' },
  { label: 'INVENTORY', href: '/inventory', icon: '⚡' },
];

export default function RootLayout({ children }) {
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
    <html lang="en">
      <body>
        <div className={styles.adminLayout}>
          {/* Sidebar Navigation */}
          <aside className={styles.sidebar}>
            <div className={styles.logo}>
              <Link href="/">BEYOND STICH.</Link>
              <span className={styles.badge}>ADMIN</span>
            </div>

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
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
