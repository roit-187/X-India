const API_URL = typeof window !== 'undefined'
  ? ''
  : (process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.xindia.live');

async function apiFetch(path, { revalidate = 3600, tags, ...init } = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    ...(init.cache === 'no-store' ? {} : { next: { revalidate, ...(tags ? { tags } : {}) } }),
  });
}

export async function getSeller(slug) {
  const res = await apiFetch(`/api/public/sellers/${slug}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load seller');
  const data = await res.json();
  return data.seller;
}

export async function getSellerDestination(slug) {
  const res = await fetch(`${API_URL}/api/public/sellers/${encodeURIComponent(slug)}/destination`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Could not resolve this portfolio. Please try again.');
  return res.json();
}

export async function getSellerProducts(slug, { page = 1, limit = 20, category } = {}) {
  const params = new URLSearchParams({ page: String(page) });
  params.set('limit', String(limit));
  if (category && category !== 'all') params.set('category', category);
  const res = await apiFetch(`/api/public/sellers/${slug}/products?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not load seller products. Please try again.');
  return res.json();
}

export async function getPublicProduct(id) {
  if (!/^[a-f\d]{24}$/i.test(String(id || ''))) return null;
  const res = await apiFetch(`/api/public/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Could not load this product. Please try again.');
  const data = await res.json();
  return data?.success ? data.product || null : null;
}

export async function getSellerReviews(slug, { page = 1 } = {}) {
  // Seller entitlement may change immediately when an admin edits plan validity.
  const res = await apiFetch(`/api/public/sellers/${slug}/reviews?page=${page}`, {
    cache: 'no-store',
  });
  if (!res.ok) return { reviews: [], averageRating: 0, totalReviews: 0, totalPages: 1 };
  return res.json();
}

export async function getSellerOpportunity(slug) {
  const res = await apiFetch(`/api/public/sellers/${slug}/opportunity`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.opportunity;
}

export async function getSellerOpportunities(slug) {
  const res = await apiFetch(`/api/public/sellers/${encodeURIComponent(slug)}/opportunities`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not load seller opportunities.');
  return res.json();
}

export async function submitSellerReview(slug, payload) {
  const res = await fetch(`${API_URL}/api/public/sellers/${slug}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit review');
  return data.review;
}

export async function getAllPublishedSlugs() {
  // Lightweight best-effort call for sitemap.ts. If the backend doesn't have
  // a bulk endpoint, this quietly returns an empty list rather than failing
  // the whole sitemap build.
  try {
    const res = await apiFetch('/api/public/sellers/slugs', { revalidate: 60 });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slugs || [];
  } catch {
    return [];
  }
}

export async function getLegalDocument(type, lang = 'en') {
  try {
    const endpoint = typeof window !== 'undefined'
      ? `/api/legal/documents/${type}/current?lang=${lang}`
      : `/api/v1/legal/documents/${type}/current?lang=${lang}`;
    const res = await apiFetch(endpoint, {
      revalidate: 60,
      tags: [`legal-${type}`],
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.document || null;
  } catch (err) {
    console.error(`[getLegalDocument] Failed to load ${type}:`, err.message);
    return null;
  }
}

export async function getSystemConfig() {
  try {
    const endpoint = typeof window !== 'undefined'
      ? '/api/system/config'
      : '/api/system/config';
    const res = await apiFetch(endpoint, {
      revalidate: 30,
      tags: ['system-config'],
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.config || null;
  } catch (err) {
    console.error('[getSystemConfig] Error:', err.message);
    return null;
  }
}

export { API_URL };
