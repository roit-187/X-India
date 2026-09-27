const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.live';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/staff/',
          '/staff',
          '/api/admin/',
          '/api/auth/admin-login',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
