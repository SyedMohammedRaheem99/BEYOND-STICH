'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import CustomCursor from '@/components/layout/CustomCursor';
import PageLoader from '@/components/layout/PageLoader';
import ToastManager from '@/components/layout/ToastManager';

export default function ClientLayout({ children }) {
  return (
    <>
      <PageLoader />
      <CustomCursor />
      <ToastManager />
      <Navbar />
      <CartDrawer />
      <main style={{ minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
