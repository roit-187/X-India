const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function apiFetch(path, { revalidate = 3600, ...init } = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    next: { revalidate },
  });
}

export async function getSeller(slug) {
  const res = await apiFetch(`/api/public/sellers/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load seller');
  const data = await res.json();
  return data.seller;
}

export async function getSellerProducts(slug, { page = 1, category } = {}) {
  const params = new URLSearchParams({ page: String(page) });
  if (category && category !== 'all') params.set('category', category);
  const res = await apiFetch(`/api/public/sellers/${slug}/products?${params.toString()}`);
  if (!res.ok) return { products: [], total: 0, totalPages: 1 };
  return res.json();
}

export async function getSellerReviews(slug, { page = 1 } = {}) {
  // Uncached — reviews are auto-approved and must appear immediately after
  // submission, so this intentionally skips ISR caching (unlike other reads).
  const res = await fetch(`${API_URL}/api/public/sellers/${slug}/reviews?page=${page}`, { cache: 'no-store' });
  if (!res.ok) return { reviews: [], averageRating: 0, totalReviews: 0, totalPages: 1 };
  return res.json();
}

export async function getSellerOpportunity(slug) {
  const res = await apiFetch(`/api/public/sellers/${slug}/opportunity`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.opportunity;
}

export async function getSellerOpportunities(slug) {
  const res = await apiFetch(`/api/public/sellers/${slug}/opportunities`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.opportunities || [];
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
    const res = await apiFetch('/api/public/sellers/slugs', { revalidate: 3600 });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slugs || [];
  } catch {
    return [];
  }
}

export { API_URL };
