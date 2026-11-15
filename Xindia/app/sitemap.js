import { getAllPublishedSlugs } from '@/lib/api';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.live').replace(/\/$/, '');

// Refresh as sellers publish, renew or change destination; do not freeze at build time.
export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const entries = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ];

  const sellers = await getAllPublishedSlugs();
  for (const { slug, updatedAt, destination } of sellers) {
    // Legacy sub-pages redirect to this single canonical document. Custom sites
    // publish their own sitemap; omit the XINDIA URL while it redirects away.
    if (!slug) continue;
    if (destination) continue;
    const modifiedAt = updatedAt ? new Date(updatedAt) : null;
    entries.push({
      url: `${SITE_URL}/p/${encodeURIComponent(slug)}`,
      ...(modifiedAt && Number.isFinite(modifiedAt.getTime()) ? { lastModified: modifiedAt } : {}),
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  return entries;
}
