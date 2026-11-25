'use client';

import { useEffect, Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomTabBar from '@/components/layout/BottomTabBar';
import CartDrawer from '@/components/layout/CartDrawer';
import PageLoader from '@/components/layout/PageLoader';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import WhatsAppWidget from '@/components/ui/WhatsAppWidget';
import CustomCursor from '@/components/ui/CustomCursor';
import StoreHydration from '@/components/layout/StoreHydration';
import PageViewTracker from '@/components/analytics/PageViewTracker';

export default function ClientLayout({ children, segments = [] }) {
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
        {/* useSearchParams needs a Suspense boundary in the App Router. */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <PageLoader />
        {/* Self-disables on touch devices and under reduced-motion — see
            CustomCursor.jsx for why the previous version was removed. */}
        <CustomCursor />
        <AnnouncementBar />
        <Navbar segments={segments} />
        <CartDrawer />
        <main
          id="main-content"
          className="app-main"
          style={{ minHeight: '100vh', paddingTop: 'var(--header-height)' }}
        >
          {children}
        </main>
        <Footer segments={segments} />
        <WhatsAppWidget />
        <BottomTabBar />
      </SessionProvider>
    </MotionConfig>
  );
}

