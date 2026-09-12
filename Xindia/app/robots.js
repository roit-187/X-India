const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://x-india.vercel.app';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
