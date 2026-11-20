export const metadata = {
  title: 'Verify Your Email | Beyond Stich',
  // The URL carries the customer's email address, so it must never be
  // indexed — same reason the other auth routes are excluded.
  robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({ children }) {
  return children;
}
