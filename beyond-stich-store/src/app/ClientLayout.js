'use client';

import { MotionConfig } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import CustomCursor from '@/components/layout/CustomCursor';
import PageLoader from '@/components/layout/PageLoader';
import ScrollProgress from '@/components/layout/ScrollProgress';
import AnnouncementBar from '@/components/layout/AnnouncementBar';

export default function ClientLayout({ children }) {
  return (
    // reducedMotion="user" makes every framer-motion animation in the app
    // automatically honor the visitor's prefers-reduced-motion setting.
    <MotionConfig reducedMotion="user">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <PageLoader />
      <ScrollProgress />
      <AnnouncementBar />
      <CustomCursor />
      <Navbar />
      <CartDrawer />
      <main
        id="main-content"
        style={{ minHeight: '100vh', paddingTop: 'var(--header-height)' }}
      >
        {children}
      </main>
      <Footer />
    </MotionConfig>
  );
}
