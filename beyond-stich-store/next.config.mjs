/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Block the site being framed elsewhere (clickjacking a checkout).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak full URLs (including any order params) to third parties.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // `payment` and `accelerometer` are allowed for self and for
            // Razorpay's checkout iframe: its UPI and card flows use the
            // Payment Request API and the device orientation sensor, and
            // the browser was refusing both ("Permissions policy
            // violation: accelerometer is not allowed in this document").
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=(), ' +
              'payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com"), ' +
              'accelerometer=(self "https://api.razorpay.com" "https://checkout.razorpay.com")',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
