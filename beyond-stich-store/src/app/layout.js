import './globals.css';
import { Barlow_Condensed, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import ClientLayout from './ClientLayout';
import OrganizationSchema from '@/components/seo/OrganizationSchema';
import LocalBusinessSchema from '@/components/seo/LocalBusinessSchema';
import WebSiteSchema from '@/components/seo/WebSiteSchema';

// Self-hosted, optimized fonts. Exposed as CSS variables consumed by the
// design tokens in globals.css (--font-display / --font-body). Using next/font
// removes the render-blocking @import and prevents font-swap layout shift.
const fontDisplay = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display-src',
  display: 'swap',
});

const fontBody = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body-src',
  display: 'swap',
});

// viewportFit: 'cover' is what makes env(safe-area-inset-*) resolve to real
// values instead of 0, so fixed bottom bars (the PDP add-to-cart bar, the
// WhatsApp button) clear the iPhone home indicator. Zoom is deliberately left
// enabled — disabling it fails WCAG.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata = {
  metadataBase: new URL('https://beyondstich.com'),
  title: 'Beyond Stich — Wear the thought.',
  description:
    'Premium oversized graphic tees for men. Bold typography, unique designs across 12+ segments — GYM, COFFEE, MUSIC, GAMER & more. Built for those who think different.',
  alternates: {
    canonical: 'https://beyondstich.com',
  },
  openGraph: {
    title: 'Beyond Stich — Wear the thought.',
    description:
      'Premium oversized graphic tees for men who think different.',
    url: 'https://beyondstich.com',
    siteName: 'Beyond Stich',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/banners/og/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Beyond Stich — Wear the thought.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beyond Stich — Wear the thought.',
    description:
      'Premium oversized graphic tees for men who think different.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>
        <noscript>
          <style>{`* { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        <OrganizationSchema />
        <LocalBusinessSchema />
        <WebSiteSchema />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
