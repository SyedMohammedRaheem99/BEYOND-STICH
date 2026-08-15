import './globals.css';
import AdminShell from './AdminShell';

// A Server Component purely so these can be exported. Without a viewport meta
// tag, mobile browsers assume a ~980px page and scale the whole admin down —
// which meant none of the responsive CSS in layout.module.css or
// products/page.module.css ever matched on a phone.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'Beyond Stich — Admin',
  description: 'Command centre for the Beyond Stich store.',
  // Never let an admin URL be indexed.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
