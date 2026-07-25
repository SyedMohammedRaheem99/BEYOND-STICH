import './globals.css';
import ClientLayout from './ClientLayout';

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
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
