'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import CustomCursor from '@/components/layout/CustomCursor';
import PageLoader from '@/components/layout/PageLoader';
import ScrollProgress from '@/components/layout/ScrollProgress';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import WhatsAppWidget from '@/components/ui/WhatsAppWidget';
import StoreHydration from '@/components/layout/StoreHydration';

export default function ClientLayout({ children }) {
  useEffect(() => {
    document.documentElement.classList.add('js-loaded');
  }, []);

  return (
    // template.js and several other components' comments already claimed
    // "respects prefers-reduced-motion via the app-level MotionConfig" — but
    // no MotionConfig existed anywhere in the app, so that protection was
    // never actually in effect for framer-motion's ~40 other animated
    // components. reducedMotion="user" defers to the OS setting.
    <MotionConfig reducedMotion="user">
      <SessionProvider>
        <StoreHydration />
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
        <WhatsAppWidget />
      </SessionProvider>
    </MotionConfig>
  );
}

