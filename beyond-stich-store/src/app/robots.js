export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beyondstich.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/feed/'],
        disallow: ['/admin', '/api/', '/account/', '/checkout/', '/login', '/register', '/forgot-password', '/reset-password/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
