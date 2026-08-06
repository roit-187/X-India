import { getAllPublishedSlugs } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.com';
const SUB_PAGES = ['', '/products', '/factory', '/ratings', '/opportunities', '/contact'];

export default async function sitemap() {
  const entries = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ];

  const sellers = await getAllPublishedSlugs();
  for (const { slug, updatedAt } of sellers) {
    for (const sub of SUB_PAGES) {
      entries.push({
        url: `${SITE_URL}/p/${slug}${sub}`,
        lastModified: updatedAt ? new Date(updatedAt) : new Date(),
        changeFrequency: 'daily',
        priority: sub === '' ? 0.8 : 0.5,
      });
    }
  }

  return entries;
}
