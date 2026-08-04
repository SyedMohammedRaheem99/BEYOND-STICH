import './globals.css';
import { Barlow_Condensed, Space_Grotesk } from 'next/font/google';
import ClientLayout from './ClientLayout';

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

export const metadata = {
  title: 'Beyond Stich — Wear the thought.',
  description:
    'Premium oversized graphic tees for men. Bold typography, unique designs across 12+ segments — GYM, COFFEE, MUSIC, GAMER & more. Built for those who think different.',
  keywords: [
    'oversized tshirts',
    'graphic tees',
    'mens streetwear',
    'beyond stich',
    'typography tshirts',
    'premium tees india',
  ],
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
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
